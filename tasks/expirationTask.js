const cron = require('node-cron');
const AdminUser = require("../models/AdminUser");

const markExpiredAccountsAsInactive = async () => {
    const now = new Date();

    try {
        // Expire demo accounts
        const demoExpirationDate = new Date(now);
        demoExpirationDate.setDate(demoExpirationDate.getDate() - 1);
        await markAccountsAsInactive('demo', demoExpirationDate);

        // Expire accounts based on account type
        // await markAccountsAsInactive('1Month', calculateExpirationDate(now, 1));
        // await markAccountsAsInactive('2Month', calculateExpirationDate(now, 2));
        // await markAccountsAsInactive('3Month', calculateExpirationDate(now, 3));

        await markAccountsAsInactive('1Month', demoExpirationDate);
        await markAccountsAsInactive('2Month', demoExpirationDate);
        await markAccountsAsInactive('3Month', demoExpirationDate);        

    } catch (error) {
        console.error('Error marking accounts as inactive:', error);
    }
};

const markAccountsAsInactive = async (accountType, expirationDate) => {
    console.log('accountType', accountType);
    console.log('expirationDate', expirationDate);

    const matchingUsers = await AdminUser.find({
        createdAt: { $lte: expirationDate },
        accountType: accountType,
        isActive: true
    });
    console.log('matchingUsers', matchingUsers);

    if (matchingUsers.length > 0) {
        // Perform the update
        await User.updateMany(
            { createdAt: { $lte: expirationDate }, accountType: accountType, isActive: true },
            { $set: { isActive: false } }
        );

        console.log(`Expired ${accountType} accounts marked as inactive`);
    } else {
        console.log(`No expired ${accountType} accounts to mark as inactive`);
    }
};

// const calculateExpirationDate = (startDate, months) => {
//     const expirationDate = new Date(startDate);
//     expirationDate.setMonth(expirationDate.getMonth() - months);
//     return expirationDate;
// };

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    // Call the function to mark expired accounts as inactive
    await markExpiredAccountsAsInactive();
});
