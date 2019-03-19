import Client from 'chatexchange';

// If running locally, load env vars from .env file
if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.load({ debug: process.env.DEBUG });
}

// Environment variables
const chatDomain = process.env.CHAT_DOMAIN;
const chatRoomId = process.env.CHAT_ROOM_ID;
const accountEmail = process.env.ACCOUNT_EMAIL;
const accountPassword = process.env.ACCOUNT_PASSWORD;

// App variables
const ignoredEventTypes = [
//  1,  // MessagePosted
    2,  // MessageEdited
    3,  // UserEntered
    4,  // UserLeft
    5,  // RoomNameChanged
    6,  // MessageStarred
//  8,  // UserMentioned
    9,  // MessageFlagged
    10, // MessageDeleted
    11, // FileAdded
    12, // MessageFlaggedForModerator
    13, // UserSettingsChanged
    14, // GlobalNotification
    15, // AccessLevelChanged
    16, // UserNotification
    17, // Invitation
//  18, // MessageReply
    19, // MessageMovedOut
    20, // MessageMovedIn
    21, // TimeBreak
    22, // FeedTicker
    29, // UserSuspended
    30, // UserMerged
    34, // UserNameOrAvatarChanged
    7, 23, 24, 25, 26, 27, 28, 31, 32, 33, 35 // InternalEvents
];


const main = async () => {

    const client = new Client(chatDomain);
    await client.login(accountEmail, accountPassword);

    const me = await client.getMe();
    const myProfile = await client._browser.getProfile(me.id);
    console.log(`Logged in to ${me._browser._chatRoot}.`, {
        userId: me._browser._userId,
        userName: me._browser._userName,
        fkey: me._browser._chatFKey
    }, '\n');
    
    const room = await client.joinRoom(chatRoomId);

    room.on('message', async msg => {

        // Ignore stuff from Community or Feeds users
        if([-1, -2].includes(msg.userId)) return;

        // Ignore unnecessary events
        if(ignoredEventTypes.includes(msg.eventType)) return;
        
        // Get details of user who triggered the message
        const user = msg.userId == me.id ? myProfile : await client._browser.getProfile(msg.userId);

        console.log(user.name, msg.eventType, msg, '\n');

        // Mentioned (not replied-to)
        if (msg.eventType === 8 && msg.targetUserId === me.id) {
            await msg.reply(`Hello ${user.name}! I'm ${myProfile.name} and ${myProfile.about}.`);
        }
    });

    // Connect to the room, and listen for new events
    await room.watch();

    console.log(`Initialized and standing by in room ${chatRoomId}...\n`);
}
main();


// Required to keep Heroku free web dyno alive for more than 60 seconds
if (process.env.NODE_ENV === 'production') {

    const express = require('express');
    const path = require('path');
    const app = express().set('port', process.env.PORT || 5000);
    
    const staticPath = path.join(__dirname, '../static');
    app.use('/', express.static(staticPath));
            
    app.listen(app.get('port'), () => {
        console.log(`Node app ${staticPath} is listening on port ${app.get('port')}.\n`);
    });
}
