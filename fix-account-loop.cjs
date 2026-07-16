const fs = require('fs');
let lines = fs.readFileSync('src/components/AccountPage.tsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('LoyaltyGrowthService.getUserAddresses(userProfile.id).then'));
if (startIdx > -1) {
  // Find the React.useEffect line before it
  let effectStart = startIdx;
  while(effectStart >= 0 && !lines[effectStart].includes('React.useEffect(() => {')) {
    effectStart--;
  }
  let effectEnd = startIdx;
  while(effectEnd < lines.length && !lines[effectEnd].includes('}, [userProfile?.id, setSavedAddresses]);')) {
    effectEnd++;
  }
  if (effectStart >= 0 && effectEnd < lines.length) {
    lines.splice(effectStart, effectEnd - effectStart + 1);
    fs.writeFileSync('src/components/AccountPage.tsx', lines.join('\n'));
    console.log("Removed infinite loop useEffect from AccountPage.tsx");
  }
}
