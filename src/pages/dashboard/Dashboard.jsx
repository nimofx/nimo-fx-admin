import { useEffect, useState } from "react";
import {
  getPendingTransactionsApi,
  getAllTransactionsApi,
  approveTransactionApi,
  rejectTransactionApi,

  getAllUsersApi,
  blockUserApi,
  unblockUserApi,
  updateUserBalanceApi,

  getAllKycApi,
  approveKycApi,
  rejectKycApi,

  getAllSupportApi,
  replySupportApi,
  closeSupportApi,

  getDepositSettingsApi,
  updateDepositSettingApi,

  getAdminTradeProfitsApi,
  createTradeProfitApi,
} from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const API_ORIGIN = "https://nimo-fx-backend.onrender.com";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "deposits", label: "Deposits" },
  { key: "withdraws", label: "Withdrawals" },
  { key: "transactions", label: "Transactions" },
  { key: "users", label: "Users" },
  { key: "depositSettings", label: "Deposit Addresses" },
  { key: "tradeProfits", label: "Trade Profit %" },
  { key: "kyc", label: "KYC" },
  { key: "support", label: "Support" },
];

const Dashboard = () => {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [depositSettings, setDepositSettings] = useState([]);
  const [tradeProfits, setTradeProfits] = useState([]);

  const [addressDrafts, setAddressDrafts] = useState({});
  const [qrFiles, setQrFiles] = useState({});
  const [profitPercent, setProfitPercent] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [savingProfit, setSavingProfit] = useState(false);

  const fileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const clean = path.replace(/\\/g, "/");

    if (clean.startsWith("/uploads")) {
      return `${API_ORIGIN}${clean}`;
    }

    return `${API_ORIGIN}/${clean}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === "users") {
        const data = await getAllUsersApi();
        setUsers(Array.isArray(data) ? data : []);
        return;
      }

      if (activeTab === "depositSettings") {
        const data = await getDepositSettingsApi();
        const list = Array.isArray(data) ? data : [];

        setDepositSettings(list);

        const drafts = {};
        list.forEach((item) => {
          drafts[item.chain] = item.address || "";
        });

        setAddressDrafts(drafts);
        return;
      }

      if (activeTab === "tradeProfits") {
        const data = await getAdminTradeProfitsApi();
        setTradeProfits(Array.isArray(data) ? data : []);
        return;
      }

      if (activeTab === "kyc") {
        const data = await getAllKycApi();
        setKycRequests(Array.isArray(data) ? data : []);
        return;
      }

      if (activeTab === "support") {
        const data = await getAllSupportApi();
        setSupportTickets(Array.isArray(data) ? data : []);
        return;
      }

      let data = [];

      if (activeTab === "dashboard") {
        data = await getPendingTransactionsApi();
      } else if (activeTab === "deposits") {
        data = await getAllTransactionsApi({ type: "deposit" });
      } else if (activeTab === "withdraws") {
        data = await getAllTransactionsApi({ type: "withdraw" });
      } else if (activeTab === "transactions") {
        data = await getAllTransactionsApi();
      }

      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const copyText = async (text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied");
    } catch {
      alert("Copy failed");
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this transaction?")) return;

    try {
      await approveTransactionApi(id);
      await fetchData();
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this transaction?")) return;

    try {
      await rejectTransactionApi(id);
      await fetchData();
    } catch (err) {
      alert(err.message || "Reject failed");
    }
  };

  const handleBlockUser = async (user) => {
    if (!window.confirm(`Block ${user.email}?`)) return;

    try {
      await blockUserApi(user._id);
      await fetchData();
    } catch (err) {
      alert(err.message || "Block failed");
    }
  };

  const handleUnblockUser = async (user) => {
    if (!window.confirm(`Unblock ${user.email}?`)) return;

    try {
      await unblockUserApi(user._id);
      await fetchData();
    } catch (err) {
      alert(err.message || "Unblock failed");
    }
  };

  const handleEditBalance = async (user, action) => {
    const amount = window.prompt(
      `${action === "add" ? "Add" : "Subtract"} wallet balance for ${user.email}`
    );

    if (!amount) return;

    const num = Number(amount);

    if (isNaN(num) || num <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (!window.confirm(`${action} ${num} USDT for ${user.email}?`)) return;

    try {
      await updateUserBalanceApi(user._id, num, action);
      await fetchData();
    } catch (err) {
      alert(err.message || "Balance update failed");
    }
  };

  const handleApproveKyc = async (user) => {
    if (!window.confirm(`Approve KYC for ${user.email}?`)) return;

    try {
      await approveKycApi(user._id);
      await fetchData();
    } catch (err) {
      alert(err.message || "KYC approve failed");
    }
  };

  const handleRejectKyc = async (user) => {
    if (!window.confirm(`Reject KYC for ${user.email}?`)) return;

    try {
      await rejectKycApi(user._id);
      await fetchData();
    } catch (err) {
      alert(err.message || "KYC reject failed");
    }
  };

  const handleReplySupport = async (ticket) => {
    const reply = window.prompt(`Reply to ${ticket.user?.email || "user"}`);

    if (!reply || !reply.trim()) return;

    try {
      await replySupportApi(ticket._id, reply.trim());
      await fetchData();
    } catch (err) {
      alert(err.message || "Reply failed");
    }
  };

  const handleCloseSupport = async (ticket) => {
    if (!window.confirm("Close this support ticket?")) return;

    try {
      await closeSupportApi(ticket._id);
      await fetchData();
    } catch (err) {
      alert(err.message || "Close failed");
    }
  };

  const handleAddressChange = (chain, value) => {
    setAddressDrafts((prev) => ({
      ...prev,
      [chain]: value,
    }));
  };

  const handleQrChange = (chain, file) => {
    setQrFiles((prev) => ({
      ...prev,
      [chain]: file || null,
    }));
  };

  const handleSaveDepositSetting = async (setting) => {
    const chain = setting.chain;
    const address = addressDrafts[chain] || "";
    const qrFile = qrFiles[chain] || null;

    if (!window.confirm(`Update deposit address for ${chain}?`)) return;

    try {
      await updateDepositSettingApi(chain, address, qrFile);

      setQrFiles((prev) => ({
        ...prev,
        [chain]: null,
      }));

      await fetchData();
      alert("Deposit setting updated");
    } catch (err) {
      alert(err.message || "Failed to update deposit setting");
    }
  };

  const handleCreateTradeProfit = async () => {
    const value = Number(profitPercent);

    if (profitPercent.trim() === "" || isNaN(value) || value < 0 || value > 100) {
      alert("Enter valid profit percentage between 0 and 100");
      return;
    }

    if (
      !window.confirm(
        `Save ${value}% profit for today? This will settle all active user trades.`
      )
    ) {
      return;
    }

    try {
      setSavingProfit(true);

      const res = await createTradeProfitApi(value);

      setProfitPercent("");
      await fetchData();

      alert(
        `Profit saved successfully. Settled trades: ${res?.settledCount || 0}`
      );
    } catch (err) {
      alert(err.message || "Failed to save trade profit");
    } finally {
      setSavingProfit(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter === "all") return true;
    return tx.status === statusFilter;
  });

  const filteredKyc = kycRequests.filter((item) => {
    if (statusFilter === "all") return true;
    return item.kycStatus === statusFilter;
  });

  const filteredSupport = supportTickets.filter((item) => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  const depositsCount = transactions.filter((tx) => tx.type === "deposit").length;
  const withdrawsCount = transactions.filter((tx) => tx.type === "withdraw").length;

  const activeUsersCount = users.filter((u) => u.isActive).length;
  const blockedUsersCount = users.filter((u) => !u.isActive).length;

  const pendingKycCount = kycRequests.filter((u) => u.kycStatus === "pending").length;
  const approvedKycCount = kycRequests.filter((u) => u.kycStatus === "approved").length;
  const rejectedKycCount = kycRequests.filter((u) => u.kycStatus === "rejected").length;

  const openSupportCount = supportTickets.filter((t) => t.status === "open").length;
  const repliedSupportCount = supportTickets.filter((t) => t.status === "replied").length;
  const closedSupportCount = supportTickets.filter((t) => t.status === "closed").length;

  const activeDepositAddressCount = depositSettings.filter((item) => item.address).length;
  const qrDepositCount = depositSettings.filter((item) => item.qrImage).length;

  const latestTradeProfit = tradeProfits?.[0] || null;

  const renderTransactionTable = () => {
    if (loading) return <div style={styles.emptyBox}>Loading...</div>;

    if (filteredTransactions.length === 0) {
      return <div style={styles.emptyBox}>No transactions found</div>;
    }

    return (
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Chain</th>
              <th style={styles.th}>TXID</th>
              <th style={styles.th}>Wallet Address</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx._id}>
                <td style={styles.td}>
                  <div style={styles.boldText}>{tx.user?.email || "-"}</div>
                  <div style={styles.smallText}>{tx.user?.name || ""}</div>
                </td>

                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.typeBadge,
                      background: tx.type === "deposit" ? "#ecfdf5" : "#fff7ed",
                      color: tx.type === "deposit" ? "#047857" : "#c2410c",
                    }}
                  >
                    {tx.type || "-"}
                  </span>
                </td>

                <td style={styles.td}>
                  <b>{Number(tx.amount || 0).toFixed(2)} USDT</b>
                </td>

                <td style={styles.td}>{tx.chain || "-"}</td>

                <td style={styles.td}>
                  {tx.txId ? (
                    <>
                      <div style={styles.copyText}>{tx.txId}</div>
                      <button style={styles.copyBtn} onClick={() => copyText(tx.txId)}>
                        Copy TXID
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>

                <td style={styles.td}>
                  {tx.walletAddress ? (
                    <>
                      <div style={styles.copyText}>{tx.walletAddress}</div>
                      <button style={styles.copyBtn} onClick={() => copyText(tx.walletAddress)}>
                        Copy Address
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>

                <td style={styles.td}>
                  <StatusBadge status={tx.status} />
                </td>

                <td style={styles.td}>
                  {tx.status === "pending" ? (
                    <div style={styles.actionRow}>
                      <button style={styles.approveBtn} onClick={() => handleApprove(tx._id)}>
                        Approve
                      </button>

                      <button style={styles.rejectBtn} onClick={() => handleReject(tx._id)}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={styles.smallText}>Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUsersTable = () => {
    if (loading) return <div style={styles.emptyBox}>Loading users...</div>;

    if (users.length === 0) {
      return <div style={styles.emptyBox}>No users found</div>;
    }

    return (
      <div style={styles.tableWrap}>
        <table style={styles.userTable}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Wallet Balance</th>
              <th style={styles.th}>Locked Balance</th>
              <th style={styles.th}>KYC</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={styles.td}>
                  <div style={styles.boldText}>{user.email || "-"}</div>
                  <div style={styles.smallText}>{user.name || "-"}</div>
                </td>

                <td style={styles.td}>
                  <span style={styles.typeBadge}>
                    {user.roles?.includes("admin") || user.role === "admin" ? "admin" : "user"}
                  </span>
                </td>

                <td style={styles.td}>
                  <b>{Number(user.walletBalance || 0).toFixed(2)} USDT</b>
                </td>

                <td style={styles.td}>
                  {Number(user.lockBalance || 0).toFixed(2)} USDT
                </td>

                <td style={styles.td}>{user.kycStatus || "-"}</td>

                <td style={styles.td}>
                  <StatusBadge status={user.isActive ? "active" : "blocked"} />
                </td>

                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    {user.isActive ? (
                      <button style={styles.rejectBtn} onClick={() => handleBlockUser(user)}>
                        Block
                      </button>
                    ) : (
                      <button style={styles.approveBtn} onClick={() => handleUnblockUser(user)}>
                        Unblock
                      </button>
                    )}

                    <button style={styles.copyBtn} onClick={() => handleEditBalance(user, "add")}>
                      Add Balance
                    </button>

                    <button
                      style={styles.copyBtn}
                      onClick={() => handleEditBalance(user, "subtract")}
                    >
                      Subtract
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDepositSettingsTable = () => {
    if (loading) return <div style={styles.emptyBox}>Loading deposit settings...</div>;

    if (depositSettings.length === 0) {
      return <div style={styles.emptyBox}>No deposit settings found</div>;
    }

    return (
      <div style={styles.tableWrap}>
        <table style={styles.depositSettingTable}>
          <thead>
            <tr>
              <th style={styles.th}>Blockchain</th>
              <th style={styles.th}>Wallet Address</th>
              <th style={styles.th}>Current QR</th>
              <th style={styles.th}>Upload New QR</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {depositSettings.map((setting) => {
              const qr = fileUrl(setting.qrImage);
              const selectedFile = qrFiles[setting.chain];

              return (
                <tr key={setting._id || setting.chain}>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{setting.chain}</span>
                  </td>

                  <td style={styles.td}>
                    <input
                      value={addressDrafts[setting.chain] || ""}
                      onChange={(e) => handleAddressChange(setting.chain, e.target.value)}
                      placeholder={`Enter ${setting.chain} address`}
                      style={styles.addressInput}
                    />

                    {addressDrafts[setting.chain] && (
                      <button
                        style={styles.copyBtn}
                        onClick={() => copyText(addressDrafts[setting.chain])}
                      >
                        Copy Address
                      </button>
                    )}
                  </td>

                  <td style={styles.td}>
                    {qr ? (
                      <div>
                        <img src={qr} alt={setting.chain} style={styles.qrImage} />
                        <div>
                          <button
                            style={styles.copyBtn}
                            onClick={() => window.open(qr, "_blank")}
                          >
                            Open QR
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={styles.smallText}>No QR uploaded</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleQrChange(setting.chain, e.target.files?.[0] || null)
                      }
                      style={styles.fileInput}
                    />

                    {selectedFile && (
                      <div style={styles.smallText}>
                        Selected: {selectedFile.name}
                      </div>
                    )}
                  </td>

                  <td style={styles.td}>
                    <button
                      style={styles.approveBtn}
                      onClick={() => handleSaveDepositSetting(setting)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTradeProfitsTable = () => {
    if (loading) return <div style={styles.emptyBox}>Loading trade profit history...</div>;

    if (tradeProfits.length === 0) {
      return <div style={styles.emptyBox}>No trade profit history found</div>;
    }

    return (
      <div style={styles.tableWrap}>
        <table style={styles.tradeProfitTable}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Profit %</th>
              <th style={styles.th}>Added By</th>
            </tr>
          </thead>

          <tbody>
            {tradeProfits.map((item) => (
              <tr key={item._id || item.dateKey}>
                <td style={styles.td}>
                  <div style={styles.boldText}>{item.displayDate || "-"}</div>
                  <div style={styles.smallText}>{item.dateKey || ""}</div>
                </td>

                <td style={styles.td}>{item.displayTime || "-"}</td>

                <td style={styles.td}>
                  <span style={styles.profitBadge}>
                    {Number(item.profitPercent || 0).toFixed(2)}%
                  </span>
                </td>

                <td style={styles.td}>
                  <div style={styles.boldText}>{item.createdBy?.email || "-"}</div>
                  <div style={styles.smallText}>{item.createdBy?.name || ""}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderKycTable = () => {
    if (loading) return <div style={styles.emptyBox}>Loading KYC requests...</div>;

    if (filteredKyc.length === 0) {
      return <div style={styles.emptyBox}>No KYC requests found</div>;
    }

    return (
      <div style={styles.tableWrap}>
        <table style={styles.kycTable}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>DOB</th>
              <th style={styles.th}>Aadhaar</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>Documents</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredKyc.map((user) => {
              const kyc = user.kyc || {};
              const front = fileUrl(kyc.aadhaarFront);
              const back = fileUrl(kyc.aadhaarBack);

              return (
                <tr key={user._id}>
                  <td style={styles.td}>
                    <div style={styles.boldText}>{user.email || "-"}</div>
                    <div style={styles.smallText}>{user.name || "-"}</div>
                  </td>

                  <td style={styles.td}>{kyc.dob || "-"}</td>

                  <td style={styles.td}>
                    <div style={styles.copyText}>{kyc.aadhaar || "-"}</div>
                    {kyc.aadhaar && (
                      <button style={styles.copyBtn} onClick={() => copyText(kyc.aadhaar)}>
                        Copy
                      </button>
                    )}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.copyText}>
                      {[
                        kyc.address1,
                        kyc.address2,
                        kyc.district,
                        kyc.state,
                        kyc.pin,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      {front ? (
                        <button
                          style={styles.copyBtn}
                          onClick={() => window.open(front, "_blank")}
                        >
                          Front
                        </button>
                      ) : (
                        <span style={styles.smallText}>No Front</span>
                      )}

                      {back ? (
                        <button
                          style={styles.copyBtn}
                          onClick={() => window.open(back, "_blank")}
                        >
                          Back
                        </button>
                      ) : (
                        <span style={styles.smallText}>No Back</span>
                      )}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <StatusBadge status={user.kycStatus} />
                  </td>

                  <td style={styles.td}>
                    {user.kycStatus === "pending" ? (
                      <div style={styles.actionRow}>
                        <button style={styles.approveBtn} onClick={() => handleApproveKyc(user)}>
                          Approve
                        </button>

                        <button style={styles.rejectBtn} onClick={() => handleRejectKyc(user)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={styles.smallText}>Processed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSupportTable = () => {
    if (loading) return <div style={styles.emptyBox}>Loading support tickets...</div>;

    if (filteredSupport.length === 0) {
      return <div style={styles.emptyBox}>No support tickets found</div>;
    }

    return (
      <div style={styles.tableWrap}>
        <table style={styles.supportTable}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Subject</th>
              <th style={styles.th}>Message</th>
              <th style={styles.th}>Screenshot</th>
              <th style={styles.th}>Admin Reply</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSupport.map((ticket) => {
              const screenshot = fileUrl(ticket.screenshot);

              return (
                <tr key={ticket._id}>
                  <td style={styles.td}>
                    <div style={styles.boldText}>{ticket.user?.email || "-"}</div>
                    <div style={styles.smallText}>{ticket.user?.name || ""}</div>
                  </td>

                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{ticket.subject || "-"}</span>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.copyText}>{ticket.message || "-"}</div>
                  </td>

                  <td style={styles.td}>
                    {screenshot ? (
                      <button
                        style={styles.copyBtn}
                        onClick={() => window.open(screenshot, "_blank")}
                      >
                        Open
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.copyText}>{ticket.adminReply || "-"}</div>
                  </td>

                  <td style={styles.td}>
                    <StatusBadge status={ticket.status} />
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      {ticket.status !== "closed" && (
                        <>
                          <button
                            style={styles.approveBtn}
                            onClick={() => handleReplySupport(ticket)}
                          >
                            Reply
                          </button>

                          <button
                            style={styles.rejectBtn}
                            onClick={() => handleCloseSupport(ticket)}
                          >
                            Close
                          </button>
                        </>
                      )}

                      {ticket.status === "closed" && (
                        <span style={styles.smallText}>Closed</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>NIMO FX Admin</h1>
          <p style={styles.subtitle}>Manage users, KYC, support, deposits and withdrawals</p>
        </div>

        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.nav}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setStatusFilter("all");
            }}
            style={{
              ...styles.navBtn,
              ...(activeTab === tab.key ? styles.activeNavBtn : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <>
          <div style={styles.statsRow}>
            <StatCard label="Total Users" value={users.length} />
            <StatCard label="Active Users" value={activeUsersCount} />
            <StatCard label="Blocked Users" value={blockedUsersCount} />
          </div>

          <PanelHeader
            title="Users Panel"
            subtitle="Block/unblock users and edit wallet balance"
            onRefresh={fetchData}
          />

          {renderUsersTable()}
        </>
      )}

      {activeTab === "depositSettings" && (
        <>
          <div style={styles.statsRow}>
            <StatCard label="Total Chains" value={depositSettings.length} />
            <StatCard label="Addresses Set" value={activeDepositAddressCount} />
            <StatCard label="QR Uploaded" value={qrDepositCount} />
          </div>

          <PanelHeader
            title="Deposit Addresses"
            subtitle="Update USDT receiving address and QR code for each blockchain"
            onRefresh={fetchData}
          />

          {renderDepositSettingsTable()}
        </>
      )}

      {activeTab === "tradeProfits" && (
        <>
          <div style={styles.statsRow}>
            <StatCard label="History Records" value={tradeProfits.length} />
            <StatCard
              label="Latest Profit"
              value={
                latestTradeProfit
                  ? `${Number(latestTradeProfit.profitPercent || 0).toFixed(2)}%`
                  : "0.00%"
              }
            />
            <StatCard
              label="Latest Date"
              value={latestTradeProfit?.displayDate || "-"}
            />
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Trade Profit %</h3>
                <p style={styles.cardSubTitle}>
                  Enter today's profit percentage. Active trades will be settled automatically.
                </p>
              </div>

              <div style={styles.profitInputRow}>
                <input
                  value={profitPercent}
                  onChange={(e) => setProfitPercent(e.target.value)}
                  placeholder="Profit %, e.g. 2.5"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  style={styles.profitInput}
                />

                <button
                  onClick={handleCreateTradeProfit}
                  style={styles.approveBtn}
                  disabled={savingProfit}
                >
                  {savingProfit ? "Saving..." : "Save Profit"}
                </button>

                <button onClick={fetchData} style={styles.refreshBtn}>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {renderTradeProfitsTable()}
        </>
      )}

      {activeTab === "kyc" && (
        <>
          <div style={styles.statsRow}>
            <StatCard label="Pending KYC" value={pendingKycCount} />
            <StatCard label="Approved KYC" value={approvedKycCount} />
            <StatCard label="Rejected KYC" value={rejectedKycCount} />
          </div>

          <PanelHeader
            title="KYC Requests"
            subtitle="Review Aadhaar details and approve/reject users"
            onRefresh={fetchData}
            filter={
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            }
          />

          {renderKycTable()}
        </>
      )}

      {activeTab === "support" && (
        <>
          <div style={styles.statsRow}>
            <StatCard label="Open Tickets" value={openSupportCount} />
            <StatCard label="Replied Tickets" value={repliedSupportCount} />
            <StatCard label="Closed Tickets" value={closedSupportCount} />
          </div>

          <PanelHeader
            title="Support Tickets"
            subtitle="Read user issues, reply and close tickets"
            onRefresh={fetchData}
            filter={
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="replied">Replied</option>
                <option value="closed">Closed</option>
              </select>
            }
          />

          {renderSupportTable()}
        </>
      )}

      {["dashboard", "deposits", "withdraws", "transactions"].includes(activeTab) && (
        <>
          <div style={styles.statsRow}>
            <StatCard label="Showing" value={filteredTransactions.length} />
            <StatCard label="Deposits" value={depositsCount} />
            <StatCard label="Withdrawals" value={withdrawsCount} />
          </div>

          <PanelHeader
            title={
              activeTab === "dashboard"
                ? "Pending Transactions"
                : activeTab === "deposits"
                ? "Deposit Requests"
                : activeTab === "withdraws"
                ? "Withdrawal Requests"
                : "All Transactions"
            }
            subtitle="TXID, blockchain, wallet address and approval actions"
            onRefresh={fetchData}
            filter={
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            }
          />

          {renderTransactionTable()}
        </>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let background = "#fef3c7";
  let color = "#92400e";

  if (status === "approved" || status === "active" || status === "replied") {
    background = "#dcfce7";
    color = "#166534";
  }

  if (status === "rejected" || status === "blocked" || status === "closed") {
    background = "#fee2e2";
    color = "#991b1b";
  }

  if (status === "open") {
    background = "#dbeafe";
    color = "#1d4ed8";
  }

  return (
    <span
      style={{
        ...styles.statusBadge,
        background,
        color,
      }}
    >
      {status || "-"}
    </span>
  );
};

const StatCard = ({ label, value }) => (
  <div style={styles.statCard}>
    <p style={styles.statLabel}>{label}</p>
    <h2 style={styles.statValue}>{value}</h2>
  </div>
);

const PanelHeader = ({ title, subtitle, onRefresh, filter }) => (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardSubTitle}>{subtitle}</p>
      </div>

      <div style={styles.filterRow}>
        {filter}
        <button onClick={onRefresh} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>
    </div>
  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 22,
    fontFamily: "Arial, sans-serif",
    color: "#111827",
  },
  header: {
    background: "#fff",
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: 14,
  },
  logoutBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  nav: {
    background: "#fff",
    borderRadius: 18,
    padding: 10,
    marginBottom: 18,
    boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
    display: "flex",
    gap: 10,
    overflowX: "auto",
  },
  navBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    padding: "11px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  activeNavBtn: {
    background: "#111827",
    color: "#fff",
    borderColor: "#111827",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
  },
  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
  },
  statValue: {
    margin: "8px 0 0",
    fontSize: 30,
    fontWeight: 900,
  },
  card: {
    background: "#fff",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
    marginBottom: 0,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    marginBottom: 0,
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
  },
  cardSubTitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 13,
  },
  filterRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  profitInputRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 700,
  },
  refreshBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: "auto",
    marginTop: 16,
    background: "#fff",
    borderRadius: 22,
    padding: 14,
    boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
  },
  table: {
    width: "100%",
    minWidth: 1050,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  userTable: {
    width: "100%",
    minWidth: 900,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  depositSettingTable: {
    width: "100%",
    minWidth: 1000,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  tradeProfitTable: {
    width: "100%",
    minWidth: 760,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  kycTable: {
    width: "100%",
    minWidth: 1100,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  supportTable: {
    width: "100%",
    minWidth: 1100,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    padding: "8px 12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    background: "#f9fafb",
    padding: "14px 12px",
    fontSize: 14,
    verticalAlign: "top",
    borderTop: "1px solid #eef2f7",
    borderBottom: "1px solid #eef2f7",
  },
  boldText: {
    fontWeight: 700,
  },
  smallText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  typeBadge: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
  },
  profitBadge: {
    background: "#ecfdf5",
    color: "#047857",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
  },
  statusBadge: {
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
  },
  copyText: {
    maxWidth: 230,
    wordBreak: "break-all",
    color: "#334155",
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  copyBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "7px 9px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    marginTop: 8,
  },
  addressInput: {
    width: "100%",
    minWidth: 330,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    outline: "none",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  profitInput: {
    width: 190,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    outline: "none",
    fontSize: 13,
    fontWeight: 700,
  },
  fileInput: {
    width: 260,
    padding: "10px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 12,
  },
  qrImage: {
    width: 90,
    height: 90,
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
  },
  actionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  approveBtn: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    padding: "9px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
  rejectBtn: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    padding: "9px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
  emptyBox: {
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 16,
    padding: 30,
    textAlign: "center",
    color: "#64748b",
    fontWeight: 700,
    marginTop: 16,
  },
};

export default Dashboard;