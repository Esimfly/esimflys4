import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [iccid, setIccid] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const countdownInterval = useRef(null);
  const expiryRef = useRef(null);

  const handleCheck = async () => {
    setError('');
    setData(null);
    setCountdown('');
    clearInterval(countdownInterval.current);

    if (!iccid) {
      setError('Please enter ICCID');
      return;
    }

    try {
      const res = await fetch(`/api/check?iccid=${encodeURIComponent(iccid)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error fetching data');
        return;
      }

      const lastPackage = json.customer?.lastPackage;

      if (lastPackage?.expiresAt) {
        const expiryDate = new Date(lastPackage.expiresAt);
        expiryRef.current = expiryDate;
        startCountdown();
      } else {
        setCountdown('');
      }

      setData(json);
    } catch (e) {
      setError('Network error');
    }
  };

  const startCountdown = () => {
    const update = () => {
      const now = new Date();
      const expiryDate = expiryRef.current;
      const diff = expiryDate - now;
      if (diff <= 0) {
        setCountdown('Expired');
        clearInterval(countdownInterval.current);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown (`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    update(); // initial call
    countdownInterval.current = setInterval(update, 1000);
  };

  useEffect(() => {
    return () => clearInterval(countdownInterval.current); // cleanup on unmount
  }, []);

  return (
    <>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          margin: 0;
          background-color: #f4f4f4;
          text-align: center;
        }
        .logo-container {
          margin-bottom: 20px;
        }
        .logo-container img {
          width: 160px;
          height: auto;
          border-radius: 10px;
          object-fit: contain;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .container {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          max-width: 500px;
          margin: auto;
          box-shadow: 0 0 10px rgba(3, 143, 236, 0.3);
          text-align: left;
        }
        input {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          margin: 10px 0;
          border-radius: 8px;
          border: 1px solid #ccc;
        }
        button {
          padding: 10px 20px;
          font-size: 16px;
          background-color: #1100ff;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
        }
        #result {
          margin-top: 25px;
        }
        .whatsapp-inline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background-color: #25D366;
          color: white;
          border-radius: 30px;
          font-weight: bold;
          text-decoration: none;
          margin-bottom: 20px;
          justify-content: center;
          max-width: 160px;
          margin-left: auto;
          margin-right: auto;
        }
        .whatsapp-inline img {
          width: 20px;
          height: 20px;
        }
        .progress-bar {
          height: 20px;
          border-radius: 10px;
          background-color: #e0e0e0;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-bar-fill {
          height: 100%;
          transition: width 0.5s;
          background-color: #1100ff;
        }
        .countdown {
          font-weight: bold;
          margin-top: 10px;
          text-align: center;
        }
        .summary p {
          margin: 5px 0;
          font-weight: bold;
        }
        .card {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #ddd;
          margin-top: 20px;
          text-align: left;
        }
        @media (max-width: 600px) {
          .container {
            padding: 15px;
          }
          input, button {
            font-size: 15px;
          }
          .logo-container img {
            width: 300px;
          }
        }
      `}</style>

      <div className="logo-container">
        <img src="https://files.catbox.moe/s83b16.png" alt="Company Logo" />
      </div>

      <a
        href="https://wa.me/97336636509"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-inline"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
        />
        WhatsApp
      </a>

      <a
        href="https://www.instagram.com/esim_fly?igsh=YXJlem8wcWE3YWtu"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-inline"
        style={{ backgroundColor: '#E1306C' }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
          alt="Instagram"
        />
        Instagram
      </a>

      <div className="container">
        <h2 style={{ textAlign: 'center' }}>Check Data Usage</h2>
        <input
          type="text"
          id="iccid"
          placeholder="89.....Enter ICCID...."
          value={iccid}
          onChange={(e) => setIccid(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCheck();
          }}
        />
        <button onClick={handleCheck}>Check</button>

        <div id="result">
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {data && (
            <>
              <div className="summary">
                <p>
                  Total Available Balance: {data.summary?.totalAvailableBalance}
                </p>
                <p>
                  Total Activated Balance: {data.summary?.totalActivatedBalance}
                </p>
              </div>

              {data.customer?.lastPackage && (
                <div className="card">
                  <p>
                    <strong>Package:</strong> {data.customer.lastPackage.name}
                  </p>
                  <p>
                    <strong>Available Balance:</strong>{' '}
                    {data.customer.lastPackage.remaining}
                  </p>
                  <p>
                    <strong>Expires At:</strong>{' '}
                    {new Date(data.customer.lastPackage.expiresAt).toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})}
                  </p>

                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${data.customer.lastPackage.percentageUsed || 0}%`,
                      }}
                    />
                  </div>

                  <p className="countdown">{countdown}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
