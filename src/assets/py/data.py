import requests
import json
from typing import Dict, List
from dataclasses import dataclass, asdict
from datetime import datetime
import csv

# Define the states we're interested in
TARGET_STATES = {"Maryland", "Delaware", "District of Columbia", "Virginia"}

# State abbreviations
STATE_ABBR = {
    "Maryland": "MD",
    "Delaware": "DE",
    "District of Columbia": "DC",
    "Virginia": "VA"
}

@dataclass
class CountyData:
    state_id: int
    state_name: str
    state_abbr: str
    county_id: int
    county_name: str
    county_infection_rate: float
    county_vaccination_rate: float
    cases: int
    confirmed_deaths: int
    date: str

def fetch_data(url: str) -> List[str]:
    response = requests.get(url)
    return [line.strip() for line in response.text.split('\n') if line.strip()]  # Skip empty lines

def fetch_data_from_csv(file_path: str) -> List[List[str]]:
    with open(file_path, 'r', newline='', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        return list(csv_reader)
    
def parse_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, '%Y-%m-%d')

def safe_float(value: str) -> float:
    try:
        return float(value)
    except ValueError:
        return 0.0

def main():
    print("Fetching data...")
    case_data = fetch_data("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv")
    vacc_data = fetch_data("https://data.cdc.gov/api/views/8xkx-amqh/rows.csv?accessType=DOWNLOAD")
    inf_data = fetch_data("https://data.cdc.gov/api/views/nra9-vzzn/rows.csv?accessType=DOWNLOAD")
    #vacc_data = fetch_data_from_csv("vaccination.csv")
    #inf_data = fetch_data_from_csv("infection.csv")

    print("Processing data...")
    county_data: Dict[str, Dict[str, CountyData]] = {}

    # Process case and death data
    for line in case_data[1:]:  # Skip header
        parts = line.split(',')

        if len(parts) < 6:
            continue
        date, county, state, fips, cases, deaths = parts[:6]

        if state not in TARGET_STATES or not fips:
            continue
        
        fips = int(fips)
        state_id, county_id = fips // 1000, fips % 1000

        if date not in county_data:
            county_data[date] = {}
        
        county_data[date][fips] = CountyData(
            state_id=state_id,
            state_name=state,
            state_abbr=STATE_ABBR[state],
            county_id=county_id,
            county_name=county,
            county_infection_rate=0,
            county_vaccination_rate=0,
            cases=int(cases),
            confirmed_deaths=int(deaths),
            date=date
        )

    # Process vaccination data
    for line in vacc_data[1:]:  # Skip header
        parts = line.split(',')
        date, fips = parts[:2]
        state = parts[4]

        if fips == "UNK" or state not in list(STATE_ABBR.values()):
            continue
        
        try:
            fips = int(fips)
            vaccination_rate = safe_float(parts[5])
            date = datetime.strptime(parts[0], '%m/%d/%Y').strftime('%Y-%m-%d')
        except ValueError:
            continue

        if date in county_data and fips in county_data[date]:
            county_data[date][fips].county_vaccination_rate = vaccination_rate

    # Process infection rate data
    for line in inf_data[1:]:  # Skip header
        parts = line.split(',')

        try:
            state = parts[0]
            fips = int(parts[2])
            date = datetime.strptime(parts[3], '%m/%d/%Y').strftime('%Y-%m-%d')
            infection_rate = safe_float(parts[4])
        except (ValueError, IndexError):
            continue

        if state not in TARGET_STATES:
            continue
        
        if date in county_data and fips in county_data[date]:
            county_data[date][fips].county_infection_rate = infection_rate

    # Convert to list and sort by date
    result = [
        asdict(county)
        for date in sorted(county_data.keys())
        for county in county_data[date].values()
    ]

    print("Saving data to JSON file...")
    with open('covid_data.json', 'w') as f:
        json.dump(result, f, indent=2)

    print("Data processing complete. Results saved to covid_data.json")

if __name__ == "__main__":
    main()