# backend/data.py
import pandas as pd
import yfinance as yf
from datetime import date

# ─────────────────────────────────────────────
# MSTR BTC Holdings History (Step Function)
#
# Sources:
#   - BitcoinTreasuries.com / Bitbo.io:
#       https://treasuries.bitbo.io/microstrategy
#   - SEC EDGAR 8-K filings (primary source):
#       https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=MSTR&type=8-K
#   - Strategy.com official history:
#       https://www.strategy.com/history
#
# Each entry = cumulative BTC held AFTER that purchase date.
# On any day between purchases, holdings = last known value (forward-filled).
# ─────────────────────────────────────────────

HOLDINGS_HISTORY = [ # Holdings history are hard-coded for convenience, and so that scraping-related inefficiencies can be avoided
    ("2020-08-11", 21_454),
    ("2020-09-14", 38_250),
    ("2020-12-04", 40_824),
    ("2020-12-21", 70_470),
    ("2021-01-22", 70_784),
    ("2021-02-02", 71_079),
    ("2021-02-24", 90_531),
    ("2021-03-01", 90_859),
    ("2021-03-05", 91_064),
    ("2021-03-12", 91_326),
    ("2021-04-05", 91_579),
    ("2021-05-13", 91_850),
    ("2021-05-18", 92_079),
    ("2021-06-21", 105_085),
    ("2021-09-13", 114_042),
    ("2021-11-28", 121_044),
    ("2021-12-08", 122_478),
    ("2021-12-30", 124_391),
    ("2022-01-31", 125_051),
    ("2022-04-05", 129_218),
    ("2022-06-28", 129_699),
    ("2022-09-20", 130_000),
    ("2022-12-21", 131_690),  # net after partial sale
    ("2022-12-24", 132_500),
    ("2023-03-27", 138_955),
    ("2023-04-05", 140_000),
    ("2023-06-27", 152_333),
    ("2023-07-31", 152_800),
    ("2023-09-24", 158_245),
    ("2023-11-01", 158_400),
    ("2023-11-30", 174_530),
    ("2023-12-27", 189_150),
    ("2024-02-06", 190_000),
    ("2024-02-26", 193_000),
    ("2024-03-11", 205_000),
    ("2024-03-19", 214_246),
    ("2024-05-01", 214_400),
    ("2024-06-20", 226_331),
    ("2024-08-01", 226_500),
    ("2024-09-13", 244_800),
    ("2024-09-20", 252_220),
    ("2024-11-11", 279_420),
    ("2024-11-18", 331_200),
    ("2024-11-25", 386_700),
    ("2024-12-02", 402_100),
    ("2024-12-09", 423_650),
    ("2024-12-16", 439_000),
    ("2024-12-23", 444_262),
    ("2024-12-30", 446_400),
    ("2025-01-06", 447_470),
    ("2025-01-13", 450_000),
    ("2025-01-21", 461_000),
    ("2025-01-27", 471_107),
    ("2025-02-10", 478_740),
    ("2025-02-24", 499_096),
    ("2025-03-17", 499_226),
    ("2025-03-24", 506_137),
    ("2025-03-31", 528_185),
    ("2025-04-14", 531_644),
    ("2025-04-21", 538_200),
    ("2025-04-28", 553_555),
    ("2025-05-05", 555_450),
    ("2025-05-12", 568_840),
    ("2025-05-19", 576_230),
    ("2025-05-26", 580_250),
    ("2025-06-02", 580_955),
    ("2025-06-16", 592_100),
    ("2025-06-23", 592_345),
    ("2025-06-30", 597_325),
    ("2025-07-14", 601_550),
    ("2025-07-21", 607_770),
    ("2025-07-29", 628_791),
    ("2025-08-11", 629_096),
    ("2025-08-18", 629_376),
    ("2025-08-25", 632_457),
    ("2025-09-02", 636_505),
    ("2025-09-08", 638_460),
    ("2025-09-15", 638_985),
    ("2025-09-22", 639_835),
    ("2025-09-29", 640_031),
    ("2025-10-13", 640_250),
    ("2025-10-20", 640_418),
    ("2025-10-27", 640_808),
    ("2025-11-03", 641_205),
    ("2025-11-10", 641_692),
    ("2025-11-17", 649_870),
    ("2025-12-01", 650_000),
    ("2025-12-08", 660_624),
    ("2025-12-15", 671_268),
    ("2025-12-29", 672_497),
    ("2025-12-31", 672_500),
    ("2026-01-05", 673_783),
    ("2026-01-12", 687_410),
    ("2026-01-20", 709_715),
    ("2026-01-26", 712_647),
]


def get_holdings_series(start: str, end: str) -> pd.Series:
    """
    Returns a daily Series of MSTR BTC holdings between start and end dates.
    Uses forward-fill since holdings only change on purchase dates.
    """
    date_range = pd.date_range(start=start, end=end, freq="D")
    holdings_df = pd.DataFrame(HOLDINGS_HISTORY, columns=["date", "btc"])
    holdings_df["date"] = pd.to_datetime(holdings_df["date"])
    holdings_df = holdings_df.set_index("date")

    # Reindex to daily, forward-fill gaps between purchases
    holdings_series = holdings_df["btc"].reindex(date_range, method="ffill")
    return holdings_series


def get_mnav(start: str = "2020-08-11", end: str = str(date.today())) -> pd.DataFrame:
    """
    Computes daily mNAV for MSTR.

    mNAV = Market Cap / NAV
         = (MSTR price × shares outstanding) / (BTC holdings × BTC price)
    """
    # Fetch price data from Yahoo Finance
    mstr = yf.Ticker("MSTR")
    btc = yf.Ticker("BTC-USD")

    mstr_hist = mstr.history(start=start, end=end)["Close"]
    btc_hist = btc.history(start=start, end=end)["Close"]

    # Shares outstanding — fairly stable, yfinance gives current value
    # For historical accuracy we use a fixed approximation
    shares = mstr.info.get("sharesOutstanding", 325_954_147) # fallback value updated as-of 2026/4/8

    mstr_hist.index = mstr_hist.index.tz_localize(None)
    btc_hist.index = btc_hist.index.tz_localize(None)

    # Align all series to the same date index
    df = pd.DataFrame({
        "mstr_price": mstr_hist,
        "btc_price": btc_hist,
    }).dropna()

    holdings = get_holdings_series(start, end)
    df["btc_holdings"] = holdings.reindex(df.index, method="ffill")

    # Compute mNAV
    df["market_cap"] = df["mstr_price"] * shares
    df["nav"] = df["btc_holdings"] * df["btc_price"]
    df["mnav"] = df["market_cap"] / df["nav"]

    return df[["mstr_price", "btc_price", "btc_holdings", "market_cap", "nav", "mnav"]].dropna()