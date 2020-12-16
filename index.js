const functions = require('firebase-functions');
require('dotenv/config');
const cors = require("cors");
const express = require("express");
const stripe = require("stripe")(process.env.PRIIVATE_KEY);
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');


const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

// response.set('Access-Control-Allow-Origin', '*');

app.get("/hello", (req, res) => {
  res.send("You are at wrong location. Please check the link you are trying to access");
});

app.post("/xxuigjye", async (req, res) => {
//   console.log("Request:", req.body);

  let error;
  let status;
  try {
    const { product, token, contact } = req.body;

    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id
    });

    // console.log(contact);

    const output = `
      <h1>A new payment was made on Aumkeshav Sharma</h1>
      <h3>Contact Details:</h3>
      <ul>
        <li>Name: ${contact.Name}</li>
        <li>Email: ${contact.Email}</li>
        <li>Phone: ${contact.Phone}</li>
        <li>Paid for: ${product.name}</li>
      </ul>
    `;

    // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME, // generated ethereal user
      pass: process.env.MAIL_PASSWORD, // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

    const idempotency_key = uuidv4();
    const charge = await stripe.charges.create(
      {
        amount: product.price * 100,
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        description: `Purchased the ${product.name}`,
        shipping: {
          name: token.card.name,
          address: {
            line1: token.card.address_line1,
            line2: token.card.address_line2,
            city: token.card.address_city,
            country: token.card.address_country,
            postal_code: token.card.address_zip
          }
        }
      },
      {
        idempotency_key
      }
    );
    console.log("Charge:", { charge });
    status = "success";
    if (status === "success") {
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Payment Confirmation" <paymentconfirm@aumkeshavsharma.com>', // sender address
        to: 'payment@aumkeshavsharma.com', // list of receivers
        subject: "A payment was made on our website", // Subject line
        text: "Hello world?", // plain text body
        html: output, // html body
      });

      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    }
  } catch (error) {
    console.error("Error:", error);
    status = "failure";
  }

  res.json({ error, status });
});

// console.log(process.env.PRIIVATE_KEY);
// console.log(process.env.MAIL_HOST);
// console.log(process.env.MAIL_PORT);
// console.log(process.env.MAIL_PASSWORD);

exports.app = functions.https.onRequest(app);
