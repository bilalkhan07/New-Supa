export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const defaultCityAddresses = {
    "delhi": "Plot No. 42, Okhla Industrial Estate Phase III, Near Govindpuri Metro, New Delhi, Delhi 110020",
    "mumbai": "Unit 402, Trade Centre, BKC Bandra East, Near MCA Club, Mumbai, Maharashtra 400051",
    "bangalore": "Level 3, Salarpuria Tower-1, 7th Block, Koramangala, Opposite Forum Mall, Bengaluru, Karnataka 560095",
    "hyderabad": "Floor 5, Cyber Towers, HITEC City, Madhapur, Hyderabad, Telangana 500081",
    "pune": "Office 301, ICC Trade Tower, Senapati Bapat Road, Shivajinagar, Pune, Maharashtra 411016",
    "ahmedabad": "Block B, Mondeal Heights, S.G. Highway, Near ISKCON Cross Road, Ahmedabad, Gujarat 380015",
    "chennai": "Suite 502, Prestige Polygon, Anna Salai, Nandanam, Chennai, Tamil Nadu 600035",
    "kolkata": "7th Floor, Godrej Waterside, Tower 1, DP Block, Sector V, Bidhannagar, Kolkata, West Bengal 700091",
    "jaipur": "Tower A, World Trade Park, JLN Marg, Malviya Nagar, Jaipur, Rajasthan 302017",
    "lucknow": "Unit 204, Cyber Tower, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010",
    "indore": "Level 4, Brilliant Sapphire, Plot No. 10, Scheme 78 Part II, Vijay Nagar, Indore, Madhya Pradesh 452010",
    "bhopal": "Plot 14, Zone-I, Maharana Pratap Nagar, Near Chetak Bridge, Bhopal, Madhya Pradesh 462011",
    "chandigarh": "Tower B, Elante Offices, Industrial Area Phase I, Chandigarh 160002",
    "surat": "7th Floor, International Trade Centre, Majura Gate, Ring Road, Surat, Gujarat 395002",
    "kochi": "Building 2, Carnival Infopark, Phase 1, Kakkanad, Kochi, Kerala 682030",
    "nagpur": "Plot 22, IT Park, South Ambazari Road, Parsodi, Nagpur, Maharashtra 440022",
    "patna": "Floor 3, Biscomaun Tower, Gandhi Maidan, Patna, Bihar 800001",
    "delhi-ncr": "Cyber City, DLF Phase 2, Sector 24, Gurugram, Haryana 122002"
  };

  return res.status(200).json({ success: true, addresses: defaultCityAddresses });
}
