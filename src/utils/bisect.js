export async function bisectQuality(encodeFn, targetKB, maxIterations = 8) {
  let lo = 1;
  let hi = 100;
  let bestBlob = null;

  for (let i = 0; i < maxIterations; i++) {
    const mid = Math.round((lo + hi) / 2);
    const blob = await encodeFn(mid);
    if (blob.size / 1024 <= targetKB) {
      bestBlob = blob;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return bestBlob;
}
