require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3002;

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET
const SLACK_REDIRECT_URI =process.env.SLACK_REDIRECT_URI

// Step 1: Start OAuth Flow

app.get('/',(req,res)=>{
  res.send('<h1>HR-automation</h1>')
})

app.get("/slack/oauth/start", (req, res) => {
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=users:read,chat:write&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}`;
  res.redirect(slackAuthUrl);
});

// Step 2: Handle OAuth Callback
app.get("/slack/oauth/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      null,
      {
        params: {
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          code,
          redirect_uri: SLACK_REDIRECT_URI,
        },
      },
    );

    const data = tokenResponse.data;

    if (!data.ok) {
      throw new Error(data.error);
    }
    console.log("data", data);
    const accessToken = data.access_token;
    let allUsers = [];
    let cursor = null;

    do {
      const userResponse = await axios.get("https://slack.com/api/users.list", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { cursor },
      });

      const userData = userResponse.data;

      if (!userData.ok) {
        throw new Error(userData.error);
      }

      allUsers = allUsers.concat(userData.members);
      cursor = userData.response_metadata?.next_cursor;
    } while (cursor);

    // Filter active users only
    const activeUsers = allUsers
      .filter((user) => !user.deleted) // Exclude deleted users
      .map((user) => ({
        id: user.id,
        name: user.real_name || user.name,
        email: user.profile.email,
      }));

    // Return the list of participants as JSON
    // res.json({
    //   success: true,
    //   participants: activeUsers,
    // });
    res.redirect(`https://hr-automation-client.netlify.app/success?team=${encodeURIComponent(activeUsers)}`)
    // Save accessToken securely in your database for future API calls
  } catch (error) {
    console.error("Error exchanging code for token:", error.message);
    res.status(500).send("Authentication failed");
  }
});

// Step 3: Use the Access Token to Make API Calls
app.get("/send-message", async (req, res) => {
  const { userId, message } = req.query;

  if (!userId || !message) {
    return res.status(400).send("userId and message are required.");
  }

  const botToken = "xoxb-your-bot-token"; // Replace with the token you stored after auth

  try {
    const response = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: userId,
        text: message,
      },
      {
        headers: { Authorization: `Bearer ${botToken}` },
      },
    );

    if (!response.data.ok) {
      throw new Error(response.data.error);
    }

    res.send(`Message sent to ${userId}: "${message}"`);
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).send("Failed to send message");
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
