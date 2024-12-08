import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';
import { sendSUPRA } from './src/transfer';
import dotenv from 'dotenv'

import { Redis } from '@upstash/redis'

dotenv.config()
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const datamain = await redis.get('bot');
const data = await redis.get(datamain)

//username of the bot
const username = data.Username
//botkey of the bot
const botkey = data.botkey
//system prompt of the bot
const systemprompt = data.System
//behavior prompt of the bot
const Behaviorprompt = data.Behavior
//rules and actions prompt of the bot
const RAprompt = data.RulesAndActions

// Initialize your bots/APIs
const bot = new Telegraf(botkey);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});



// Store conversation history
const conversationHistory = new Map();

// Helper function to manage conversation history
function updateConversationHistory(userId, message, role = 'user') {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  
  const history = conversationHistory.get(userId);
  history.push({ role, content: message });
  
  // Keep only last 10 messages to manage context window
  if (history.length > 10) {
    history.shift();
  }
  
  conversationHistory.set(userId, history);
}

// Handle messages
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;
  
  // Update history with user's message
  updateConversationHistory(userId, userMessage);
  
  try {
    // Get conversation history
    const messages = conversationHistory.get(userId);
    console.log(messages);
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `${systemprompt}\n${Behaviorprompt}\n${RAprompt}` },
        ...messages
      ]
    });
    
    const reply = completion.choices[0].message.content;
    const reply_json = JSON.parse(reply);
    console.log(reply_json);

    const REamount = reply_json.RewardAmount;
    const amount = REamount * 1000000000;
    const recipientAddress = reply_json.WalletAddress;
    const privateKey = process.env.SECRET_KEY;

    if (reply_json.SendMoney) {
      sendSUPRA(amount, recipientAddress, privateKey)
    }

    
    // Update history with AI's response
    updateConversationHistory(userId, reply, 'assistant');
    // Send response back to user
    await ctx.reply(reply_json.Reply);
    
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply('Sorry, I encountered an error processing your request.');
  }
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
