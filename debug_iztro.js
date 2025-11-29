import * as iztro from "iztro";

try {
    const horoscope = iztro.astro.astrolabeBySolarDate("2000-01-01", 0, "male");
    console.log("Palace Keys:", Object.keys(horoscope.palaces[0]));
    console.log("Sample Palace:", JSON.stringify(horoscope.palaces[0], null, 2));
} catch (e) {
    console.error(e);
}
