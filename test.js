const requiredFields = {
  a: 1
};
const data = {};
for (const [key, val] of Object.entries(requiredFields)) {
  if (data[key] === undefined || data[key] === null || (key === 'email' && data[key] === '')) {
    console.log("update", key);
  }
}
