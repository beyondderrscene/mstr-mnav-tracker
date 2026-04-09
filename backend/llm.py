# backend/llm.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


def generate_summary(df) -> str:
    """
    Takes the mNAV DataFrame and asks Gemini to generate a brief analysis.
    """
    # Pull out key stats to feed into the prompt
    latest_mnav = df["mnav"].iloc[-1]
    avg_mnav = df["mnav"].mean()
    max_mnav = df["mnav"].max()
    min_mnav = df["mnav"].min()
    latest_date = df.index[-1] if hasattr(df.index[-1], "strftime") else df["date"].iloc[-1]

    # Last 30 days trend
    recent = df["mnav"].tail(30)
    trend = "upward" if recent.iloc[-1] > recent.iloc[0] else "downward"

    prompt = f"""
You are a financial analyst specializing in Bitcoin treasury companies.

Here is the current mNAV (Modified Net Asset Value) data for Strategy (MicroStrategy / MSTR):

- Latest mNAV ({latest_date}): {latest_mnav:.3f}
- All-time average mNAV: {avg_mnav:.3f}
- All-time high mNAV: {max_mnav:.3f}
- All-time low mNAV: {min_mnav:.3f}
- 30-day trend: {trend}

mNAV = MSTR Market Cap / (BTC Holdings × BTC Price).
A value above 1.0 means MSTR trades at a premium to its Bitcoin NAV.
A value below 1.0 means MSTR trades at a discount.

Write a concise 3-4 sentence analysis of what this data suggests about MSTR's current 
valuation relative to its Bitcoin holdings. Mention whether the premium/discount is 
historically notable and what it might signal for investors.
"""

    response = model.generate_content(prompt)
    return response.text