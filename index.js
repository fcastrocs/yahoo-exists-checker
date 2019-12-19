const Page = require('./page');
const fs = require("fs")
const formatAccounts = require("./util/formatAccounts")
const makeDirectories = require("./util/init-directories");

// Load accounts
let data = fs.readFileSync('accounts.txt');
let accounts = formatAccounts(data);

// create directories
let digits = accounts[0].steamid.split(":")[2].length
makeDirectories(digits);

const dir = `./results-${digits}dig`;


const FEED_CONSTANT = 20;
let feederId = null;
let statsId = null;
let accountsPointer = 0;
let currentChecks = 0;
let checksDone = 0;
let retries = 0;

let notRegistered = 0
let registered = 0;
let notAvailable = 0;
let otherIssue = 0;


// get initial proxies
(async () => {
	Feeder();
	Stats();
})();


function Stats() {
	if (!statsId) {
		statsId = setInterval(() => {
			process.stdout.write('\033c');
			console.log(`\n Checks Done: ${checksDone} of ${accounts.length}`);
			console.log(` Current Checks: ${currentChecks}`);
			console.log(` Retries: ${retries}\n`);

			console.log(` Not Registered: ${notRegistered}`);
			console.log(` Registered: ${registered}`);
			console.log(` Not available: ${notAvailable}`);
			console.log(` Other Issue: ${otherIssue}`);

			//stop logging if done checking
			if (checksDone == accounts.length) {
				console.log('\nDone Checking')
				clearInterval(statsId)
			}
		}, 1000);
	}
}


function Feeder() {
	// current checks must not exceed feed constant
	if (currentChecks >= FEED_CONSTANT) {
		return;
	}

	// clear interval if done.
	if (accountsPointer >= accounts.length - 1) {
		clearInterval(feederId);
		return;
	}

	// feed the checker
	for (; currentChecks < FEED_CONSTANT; currentChecks++) {
		if (accountsPointer == accounts.length) {
			break;
		}
		checkEmail(accounts[accountsPointer]);
		accountsPointer++;
	}

	// Create interval if not created
	if (!feederId) {
		feederId = setInterval(() => Feeder(), 1000);
	}
}

async function checkEmail(acc) {
	let page = new Page();

	try {
		await page.visit("https://login.yahoo.com/account/create");
	} catch (err) {
		return retryCheck(acc)
	}

	// input email
	let inputEmail = await page.findById("usernamereg-yid");
	if (inputEmail == null) {
		return retryCheck(acc)
	}

	// split and get user
	let user = acc.email.split("@")[0];

	// write user
	try {
		await page.write(inputEmail, user);
		await page.tab(inputEmail);
	} catch (err) {
		return retryCheck(acc)
	}

	setTimeout(async () => {
		let errorElement, errorText;

		try {
			errorElement = await page.findById("reg-error-yid");
		} catch (err) {
			return retryCheck(acc)
		}


		try {
			errorText = await page.getText(errorElement);
		} catch (err) {
			// error happens when email is not registered
			errorText = null;
			var type = "not-registered"
		}

		currentChecks--;
		checksDone++;
		page.close();

		writeToFile(acc, errorText, type);
	}, 1500);
}

function retryCheck(acc) {
	retries++;
	return checkEmail(acc);
}

function writeToFile(acc, errorText, type) {
	let txt = `${acc.steamurl}\n`
		+ `${acc.steamid}\n`
		+ `${acc.email}\n`
		+ `${acc.pass}\n\n`

	if (!type) {
		if (errorText.includes("already exists")) {
			registered++;
			type = "exits";
		}
		else if (errorText.includes("available for sign up")) {
			notAvailable++
			type = "not-available";
		} else {
			otherIssue++;
			type = "other-issue";
		}
	} else {
		notRegistered++
	}

	fs.appendFile(`${dir}/${type}.txt`, txt, (err) => {
		if (err) {
			fs.writeFileSync("errors.txt", err);
		}
	})
}