import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "YOUR_VITE_SUPABASE_URL"
SUPABASE_KEY = "YOUR_VITE_SUPABASE_ANON_KEY"
TARGET_URL = "https://license.mn/licensed-organizations/tabs"

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

def scrape_data():
    driver = setup_driver()
    driver.get(TARGET_URL)
    
    scraped_data = []
    
    try:
        # Wait for the "Customs General Administration" category to be visible/clickable
        # Note: Selectors should be updated based on the actual DOM of license.mn
        # Since it's a dynamic app, we wait for the table or list to load
        wait = WebDriverWait(driver, 20)
        
        # 1. Navigate to Customs category (Implementation depends on the site's UI structure)
        # Example: driver.find_element(By.XPATH, "//span[contains(text(), 'Гаалийн ерөнхий газар')]").click()
        
        # 2. Extract table rows
        # This is a placeholder selector - adjust it to match the actual license.mn table structure
        rows = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "table tr")))
        
        for row in rows[1:]:  # Skip header
            cols = row.find_elements(By.TAG_NAME, "td")
            if len(cols) >= 3:
                scraped_data.append({
                    "company_name": cols[0].text.strip(),
                    "license_number": cols[1].text.strip(),
                    "status": cols[2].text.strip(),
                    "category": "Customs",
                    "updated_at": "now()" # Database will handle this
                })
                
    except Exception as e:
        print(f"Scraping error: {e}")
    finally:
        driver.quit()
        
    return scraped_data

def upload_to_supabase(data):
    if not data:
        print("No data to upload.")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Batch upsert to 'bonded_warehouses' table
        response = supabase.table("bonded_warehouses").upsert(data, on_conflict="license_number").execute()
        print(f"Successfully uploaded {len(data)} records to Supabase.")
        return response
    except Exception as e:
        print(f"Upload error: {e}")

if __name__ == "__main__":
    print("Starting scraper...")
    data = scrape_data()
    print(f"Extracted {len(data)} items.")
    
    # Save locally for verification
    with open("bonded_warehouses.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    # Upload
    # upload_to_supabase(data)
