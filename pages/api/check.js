import axios from 'axios';

const accessToken = process.env.GIGA_STORE_ACCESS_TOKEN;

export default async function handler(req, res) {
  const iccid = req.query.iccid;

  if (!iccid) {
    return res.status(400).json({ error: 'Missing ICCID query parameter.' });
  }

  try {
    const response = await axios.post(
      'https://api.giga.store/gigastore/activations/search-customers',
      {
        pageSize: 50,
        pageIndex: 0,
        searchKey: "ICCID",
        searchQuery: iccid,
        searchMode: "contains",
        onlyActiveProfiles: true,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      }
    );

    const data = response.data;

    if (!data.customers || data.customers.length === 0) {
      return res.status(404).json({ message: 'No matching customers found.' });
    }

    let totalAvailableBalanceSum = 0;
    let totalActivatedBalanceSum = 0;

    const customers = data.customers.map(customerData => {
      const { customer, totalAvailableBalance, activatedItems, relatedEsims } = customerData;

      totalAvailableBalanceSum += totalAvailableBalance.sizeValue;

      const activatedPackages = activatedItems.map(item => {
        const b = item.balance;
        const available = b.availableBalance?.sizeValue || 0;
        const total = b.totalBalance?.sizeValue || 0;
        const percentageUsed = total ? Math.min(100, Math.round(((total - available) / total) * 100)) : 0;

        totalActivatedBalanceSum += available;

        const expiresAt = new Date(b.expiresAt);
        return {
          name: b.name,
          activatedAt: b.activatedAt,
          expiresAt: expiresAt.toISOString(),

          remaining: `${available} ${b.availableBalance?.sizeUnit || 'GB'}`,
          percentageUsed,
          countdown: getCountdownString(expiresAt),
          activationType: item.activationType,
        };
      });

      const lastPackage = activatedPackages[activatedPackages.length - 1] || null;

      const esims = relatedEsims.map(esim => ({
        iccid: esim.iccid,
        imsi: esim.imsi,
        state: esim.state,
        activatedAt: esim.activatedAt,
        appleUniversalLink: esim.appleUniversalLink,
      }));

      return {
        email: customer.email,
        uid: customer.uid,
        profileUrl: customer.profileUrl,
        totalAvailableBalance: `${totalAvailableBalance.sizeValue} ${totalAvailableBalance.sizeUnit}`,
        lastPackage,
        relatedEsims: esims,
      };
    });

    res.status(200).json({
      summary: {
        totalAvailableBalance: `${totalAvailableBalanceSum.toFixed(2)} GB`,
      },
      customer: customers[0],
    });
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
}

// ✅ Countdown formatter with seconds
function getCountdownString(expiryDate) {
  const now = Date.now();
  const end = expiryDate.getTime();
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
}
