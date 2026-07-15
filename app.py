import os
import json
import re
import traceback
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)

api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=api_key)

TONE_DESCRIPTIONS = {
    "professional": "formal, authoritative, and business-oriented. Use clear, concise language that conveys expertise and credibility.",
    "casual": "friendly, conversational, and relatable. Use informal language, emojis, and a warm tone that feels personal.",
    "promotional": "exciting, persuasive, and action-driven. Use power words, urgency, and compelling offers to drive engagement."
}

PLATFORM_TIPS = {
    "instagram": "optimized for Instagram - visually descriptive, emotionally engaging, with strong visual storytelling. Max 2200 characters.",
    "linkedin": "optimized for LinkedIn - professional insights, value-driven, thought leadership style. Max 3000 characters."
}

def extract_json(text: str) -> dict:
    cleaned = text.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Safe regex using hexadecimal representation for backticks to prevent copy-paste errors
    match = re.search(r"\x60{3}(?:json)?\s*([{\s\S]*?)\x60{3}", cleaned)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    match = re.search(r"(\{[\s\S]*\})", cleaned)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from response")

def build_prompt(product_info: str, platform: str, tone: str) -> str:
    tone_desc = TONE_DESCRIPTIONS.get(tone, "engaging")
    platform_tip = PLATFORM_TIPS.get(platform, "social media")
    
    return f"""You are an expert social media content strategist and copywriter.
Generate content based on the following:
Product/Campaign Info: {product_info}
Platform: {platform} ({platform_tip})
Tone: {tone} ({tone_desc})

Requirements:
1. Generate exactly 3 unique captions.
2. Generate exactly 10 relevant hashtags.
3. Generate exactly 3 short, punchy CTAs.

Return your response strictly as a raw JSON object matching this schema:
{{
  "captions": ["variation 1", "variation 2", "variation 3"],
  "hashtags": ["#tag1", "#tag2", ...],
  "ctas": ["cta 1", "cta 2", "cta 3"]
}}"""

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.get_json()
        product_info = data.get("product_info", "").strip()
        platform = data.get("platform", "instagram").lower()
        tone = data.get("tone", "professional").lower()

        if not product_info:
            return jsonify({"error": "Product information is required."}), 400

        if len(product_info) > 2000:
            return jsonify({"error": "Input too long. Please keep it under 2000 characters."}), 400

        prompt = build_prompt(product_info, platform, tone)

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a social media content expert. Always respond with valid JSON only, no markdown formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.8,
            max_tokens=2048,
        )

        response_text = chat_completion.choices[0].message.content
        result = extract_json(response_text)

        if not all(k in result for k in ["captions", "hashtags", "ctas"]):
            raise ValueError("Invalid response structure from AI")

        return jsonify({
            "success": True,
            "captions": result["captions"],
            "hashtags": result["hashtags"],
            "ctas": result["ctas"],
            "platform": platform,
            "tone": tone
        })

    except ValueError as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)