const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cron = require('node-cron'); 
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const port = 4000;

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'manish', 
    database: 'Todo'
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database: ', err);
        return;
    }
    console.log('MySQL connected...');
    connection.release();
});

app.post('/signup', async (req, res) => {
    const { Name, Email, Joiningdate, Enddate, Uniquecode } = req.body;

    console.log(`Inserting data: Name=${Name}, Email=${Email}, Joiningdate=${Joiningdate}, Enddate=${Enddate}, Uniquecode=${Uniquecode}`);

    try {
        const connection = await pool.getConnection();

        const [result] = await connection.query('INSERT INTO Employees (Name, Email, Joiningdate, Enddate, Uniquecode) VALUES (?, ?, ?, ?, ?)', [Name, Email, Joiningdate, Enddate, Uniquecode]);

        console.log(`Inserted ${result.affectedRows} rows`);

        connection.release();

        scheduleEmailNotification({ Name, Email, Joiningdate, Enddate });

        res.redirect('./index.html');
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ success: false, message: `Error inserting data: ${error.message}` });
    }
});


const sendEmailNotification = (formData) => { 
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "choudharym845@gmail.com",
            pass: "vavywimamalyjxfx",
        },
    });
 
    const mailOptions = {
        from: {
            name: "Manish Chaudhary",
            address: 'manish_choudhary@fosteringlinux.com'
        },
        to: formData.Email, 
        subject: "Contract Deadline",
        html: `
            <p>Dear Sir/Madam,<br>
            I would like to bring to your attention that ${formData.Name} ${formData.Email} employment contract started on ${formData.Joiningdate} and is due to end on ${formData.Enddate}. <br> I want to inform you that there are only ten days left to complete the paperwork for contracter before it ends.<br>
            I respectfully request your attention to this matter as it is essential for the smooth running of our organization and to ensure compliance with all legal and ethical obligations.<br>
            Thank you for your prompt attention, and please let me know if you need any further details.<br>
            Thanks and Regards,<br>
            Manish Chaudhary<br>
            9149111482<br>
            Intern<br>
            KEEN&ABLE PRIVATE LIMITED</p>
        `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

const scheduleEmailNotification = (formData) => {
    const currentDate = new Date();
    const endDate = new Date(formData.Enddate);
    
    const notificationDate = new Date(endDate.getTime() - 10 * 24 * 60 * 60 * 1000); 

    
    notificationDate.setHours(11, 0, 0, 0); 

    const cronPattern = `0 11 ${notificationDate.getDate()} ${notificationDate.getMonth() + 1} *`;

    cron.schedule(cronPattern, () => {
        sendEmailNotification(formData);
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    });

    console.log(`Email notification scheduled for ${notificationDate}`);
};







app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
});
