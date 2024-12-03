const express = require('express');
const app = express();

// Enable middleware to parse body of Content-type: application/json
app.use(express.json());

const { sql } = require('@vercel/postgres');
require('dotenv').config();

const PORT = 4000;

app.listen(process.env.PORT || PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// GET all students or by query parameter (filter by id)
app.get('/student', async (req, res) => {
    try {
        if (req.query.id) {
            // Query student by id: http://localhost:4000/student?id=1
            const student = await sql`SELECT * FROM Student WHERE Id = ${req.query.id};`;
            if (student.rowCount > 0) {
                return res.json(student.rows[0]);
            } else {
                return res.status(404).json({ error: 'Student not found' });
            }
        }

        // Otherwise, return all students
        const students = await sql`SELECT * FROM Student ORDER BY Id;`;
        res.json(students.rows);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching the student' });
    }
});

// GET specific student by ID
app.get('/student/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const student = await sql`SELECT * FROM Student WHERE Id = ${id};`;
        if (student.rowCount > 0) {
            res.json(student.rows[0]);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching the student' });
    }
});

// POST new student
app.post('/student', async (req, res) => {
    const { givenName, familyName, yearLevel, course, section } = req.body;

    if (!givenName || !familyName || !yearLevel || !course || !section) {
        return res.status(400).json({ error: 'All fields are required: givenName, familyName, yearLevel, course, section' });
    }

    try {
        const result = await sql`
            INSERT INTO Student (givenName, familyName, yearLevel, course, section)
            VALUES (${givenName}, ${familyName}, ${yearLevel}, ${course}, ${section})
            RETURNING id;`;

        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while creating the student' });
    }
});

// PUT update student by ID
app.put('/student/:id', async (req, res) => {
    const id = req.params.id;
    const { givenName, familyName, yearLevel, course, section } = req.body;

    try {
        const student = await sql`SELECT * FROM Student WHERE Id = ${id};`;
        if (student.rowCount === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Update the student fields
        const updatedStudent = await sql`
            UPDATE Student 
            SET 
                givenName = ${givenName || student.rows[0].givenName},
                familyName = ${familyName || student.rows[0].familyName},
                yearLevel = ${yearLevel || student.rows[0].yearLevel},
                course = ${course || student.rows[0].course},
                section = ${section || student.rows[0].section}
            WHERE Id = ${id}
            RETURNING *;`;

        res.status(200).json(updatedStudent.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while updating the student' });
    }
});

// DELETE student by ID
app.delete('/student/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await sql`DELETE FROM Student WHERE Id = ${id} RETURNING id;`;
        if (result.rowCount > 0) {
            res.status(204).json();
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while deleting the student' });
    }
});

app.get('/', (req, res) => {
    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #e6f7e0 0%, #c0e4c8 100%);
                    }
                    .container {
                        background: white;
                        padding: 2rem 4rem;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        border: 2px solid #28a745; /* Green border */
                    }
                    h1 {
                        color: #28a745; /* Green text color */
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>PRIN144-Final-Exam: RAMOS SYUTO</h1>
                </div>
            </body>
        </html>
    `;
    res.send(html);
});

module.exports = app;
