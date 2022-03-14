module.exports = {
	name: 'ready',
	execute: async (client) => {
		console.log(`I am ready! ${client.user?.tag}`);
	}
};
