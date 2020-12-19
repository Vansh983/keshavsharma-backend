// const functions = require('firebase-functions');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const express = require('express');
const stripe = require('stripe')(process.env.PRIVATE_KEY);
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());

app.use(express.json());

app.get('/hello', (req, res) => {
  res.send(
    'You are at wrong location. Please check the link you are trying to access'
  );
});

app.post('/xxuigjye', async (req, res) => {
  try {
    const { product, contact } = req.body;

    const customer = await stripe.customers.create({
      email: contact.email,
      name: contact.name,
      phone: contact.phone,
    });

    const output = `
      <h1>A new payment was made on Aumkeshav Sharma</h1>
      <h3>Contact Details:</h3>
      <ul>
        <li>Name: ${contact.name}</li>
        <li>Email: ${contact.email}</li>
        <li>Phone: ${contact.phone}</li>
        <li>Paid for: ${product.name}</li>
      </ul>
    `;

    // let transporter = nodemailer.createTransport({
    //   host: process.env.MAIL_HOST,
    //   port: process.env.MAIL_PORT,
    //   secure: true, // true for 465, false for other ports
    //   auth: {
    //     user: process.env.MAIL_USERNAME, // generated ethereal user
    //     pass: process.env.MAIL_PASSWORD, // generated ethereal password
    //   },
    //   tls: {
    //     rejectUnauthorized: false,
    //   },
    // });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      metadata: {
        time: product.time,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${product.name} - ${product.time}`,
            },
            unit_amount: product.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/?payment=success`,
      cancel_url: process.env.FRONTEND_URL,
    });

    // let info = await transporter.sendMail(
    //   {
    //     from: '"Payment Confirmation" <paymentconfirm@aumkeshavsharma.com>',
    //     to: 'payment@aumkeshavsharma.com',
    //     subject: 'A payment was made on our website',
    //     text: 'Hello woIrld?',
    //     html: output,
    //   },
    //   () => {}
    // );
    // console.log('Message sent: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    res.json({ id: session.id, status: 'success' });
  } catch (error) {
    console.error('Error:', error);
    res.json({ status: 'fail' });
  }
});

// exports.app = functions.https.onRequest(app);
app.listen(5000, () => {
  console.log('Server running');
});
