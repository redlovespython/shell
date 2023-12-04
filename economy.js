const { Client, Collection } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({ /* ... Your Client Options ... */ });

// Database Models
const User = require('./models/User'); // User model for economy

client.commands = new Collection();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to the database!'))
    .catch(err => console.error('Could not connect to the database:', err));

// Command: Check Balance
client.commands.set('balance', {
    execute: async (message) => {
        const user = await User.findOne({ userId: message.author.id }) || await User.create({ userId: message.author.id });
        message.channel.send(`${message.author.username}, you have ${user.balance} coins.`);
    }
});

// Command: Earn Coins
client.commands.set('earn', {
    execute: async (message) => {
        const amount = Math.floor(Math.random() * 50) + 1; // Earn between 1 and 50 coins
        const user = await User.findOneAndUpdate({ userId: message.author.id }, { $inc: { balance: amount } }, { new: true, upsert: true });
        message.channel.send(`${message.author.username}, you earned ${amount} coins. Your new balance is ${user.balance} coins.`);
    }
});

// Command: Leaderboard
client.commands.set('leaderboard', {
    execute: async (message) => {
        const users = await User.find({}).sort({ balance: -1 }).limit(10);
        let leaderboard = "💰 Economy Leaderboard 💰\n";
        users.forEach((user, index) => {
            leaderboard += `${index + 1}. <@${user.userId}> - ${user.balance} coins\n`;
        });
        message.channel.send(leaderboard);
    }
});

// Message Handler
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command.');
    }
});

// Login to Discord with your app's token
client.login(process.env.DISCORD_TOKEN);
