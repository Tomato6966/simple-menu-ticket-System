const { client } = require('./client/client');
const { token } = require('./config.json');

const main = async () => {
	try {
		await client.init();
		await client.login(token);
	} catch (error) {
		console.error(error);
	}
};

main();
