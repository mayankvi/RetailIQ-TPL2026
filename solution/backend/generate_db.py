import sqlite3
import pandas as pd
import numpy as np
from datetime import date, timedelta
import random
import json

random.seed(42)
np.random.seed(42)

DB_PATH = "storeiq.db"
DEMO_TODAY = date(2025, 5, 20)

print("🏗  Generating StoreIQ v2 database...")

# ── REGIONS ───────────────────────────────────────────────────────────────────
regions = [
    ("RGN-001", "Northeast", "New York"),
    ("RGN-002", "Southeast", "Atlanta"),
    ("RGN-003", "Midwest",   "Chicago"),
    ("RGN-004", "West",      "Los Angeles"),
    ("RGN-005", "Southwest", "Dallas"),
]
df_regions = pd.DataFrame(regions, columns=["region_id","region_name","hq_city"])

# ── STORES ────────────────────────────────────────────────────────────────────
stores = [
    # Northeast
    ("STR-001","Fifth Avenue Flagship","RGN-001","New York, NY",     True,  28000),
    ("STR-002","Midtown Manhattan",     "RGN-001","New York, NY",     False, 18000),
    ("STR-003","Boston Back Bay",       "RGN-001","Boston, MA",       False, 14000),
    ("STR-004","Philadelphia Center",   "RGN-001","Philadelphia, PA", False, 12000),
    # Southeast
    ("STR-005","Atlanta Buckhead",      "RGN-002","Atlanta, GA",      True,  22000),
    ("STR-006","Miami Design District", "RGN-002","Miami, FL",        False, 19000),
    ("STR-007","Charlotte SouthPark",   "RGN-002","Charlotte, NC",    False, 13000),
    ("STR-008","Nashville Green Hills", "RGN-002","Nashville, TN",    False, 11000),
    # Midwest
    ("STR-009","Chicago Magnificent Mile","RGN-003","Chicago, IL",    True,  24000),
    ("STR-010","Detroit Somerset",      "RGN-003","Detroit, MI",      False, 14000),
    ("STR-011","Minneapolis Galleria",  "RGN-003","Minneapolis, MN",  False, 12000),
    # West
    ("STR-012","Beverly Hills",         "RGN-004","Los Angeles, CA",  True,  26000),
    ("STR-013","San Francisco Union Sq","RGN-004","San Francisco, CA",False, 20000),
    ("STR-014","Seattle University Vill","RGN-004","Seattle, WA",     False, 15000),
    # Southwest
    ("STR-015","Dallas NorthPark",      "RGN-005","Dallas, TX",       True,  21000),
    ("STR-016","Houston Galleria",      "RGN-005","Houston, TX",      False, 18000),
    ("STR-017","Phoenix Scottsdale",    "RGN-005","Phoenix, AZ",      False, 13000),
]
store_cols = ["store_id","store_name","region_id","city","is_flagship","sq_footage"]
df_stores = pd.DataFrame(stores, columns=store_cols)

# ── DEPARTMENTS ───────────────────────────────────────────────────────────────
departments = [
    ("DEPT-001","Leather Goods",    0.35, 4200),
    ("DEPT-002","Ready-to-Wear",    0.20, 3800),
    ("DEPT-003","Shoes",            0.18, 2500),
    ("DEPT-004","Accessories",      0.12, 1200),
    ("DEPT-005","Jewelry & Watches",0.08,18000),
    ("DEPT-006","Fragrances",       0.07,  380),
]
dept_cols = ["dept_id","dept_name","sales_share","avg_price"]
df_depts = pd.DataFrame(departments, columns=dept_cols)

# ── EMPLOYEES (focus on flagship STR-001) ─────────────────────────────────────
employees = [
    ("EMP-001","Diana Reynolds",    "Store Director",        "Management",   "STR-001","2018-03-01","F","English,French","All Categories","Full-Time","",False,"Top"),
    ("EMP-002","Marcus Webb",       "Assistant Director",    "Management",   "STR-001","2019-06-15","M","English,Spanish","All Categories","Full-Time","",False,"Top"),
    ("EMP-003","Amy Zhang",         "Senior Client Advisor", "Selling Team", "STR-001","2020-01-10","F","English,Mandarin","Leather Goods","Full-Time","",False,"Top"),
    ("EMP-004","Robert Kline",      "Senior Client Advisor", "Selling Team", "STR-001","2019-09-20","M","English","Ready-to-Wear","Full-Time","",False,"Top"),
    ("EMP-005","Maria Santos",      "Senior Client Advisor", "Selling Team", "STR-001","2021-02-14","F","English,Spanish","Accessories","Full-Time","",False,"Top"),
    ("EMP-006","Thomas Beaumont",   "Client Advisor",        "Selling Team", "STR-001","2022-04-01","M","English,French","Leather Goods","Full-Time","",False,"Mid"),
    ("EMP-007","Pierre Dubois",     "Client Advisor",        "Selling Team", "STR-001","2021-11-08","M","English,French","Ready-to-Wear","Full-Time","",False,"Mid"),
    ("EMP-008","Sarah Mitchell",    "Senior Client Advisor", "Selling Team", "STR-001","2019-03-22","F","English","Jewelry & Watches","Full-Time","",True,"Top"),
    ("EMP-009","David Park",        "Client Advisor",        "Selling Team", "STR-001","2022-07-15","M","English","Shoes","Full-Time","",False,"Mid"),
    ("EMP-010","Priya Nair",        "Client Advisor",        "Selling Team", "STR-001","2023-01-09","F","English","Fragrances","Full-Time","",False,"Mid"),
    ("EMP-011","James Chen",        "Senior Client Advisor", "Selling Team", "STR-001","2020-08-30","M","English,Mandarin","Leather Goods","Full-Time","",True,"Top"),
    ("EMP-012","Sofia Greco",       "Client Advisor",        "Selling Team", "STR-001","2022-10-17","F","English","Ready-to-Wear","Full-Time","",False,"Mid"),
    ("EMP-013","Kevin Lim",         "Client Advisor",        "Selling Team", "STR-001","2023-03-05","M","English,Mandarin","Accessories","Full-Time","",False,"Junior"),
    ("EMP-014","Natasha Ivanova",   "Client Advisor",        "Selling Team", "STR-001","2023-06-20","F","English","Shoes","Part-Time","Wednesday",False,"Junior"),
    ("EMP-015","Li Wei",            "Client Advisor",        "Selling Team", "STR-001","2022-12-01","M","English,Mandarin","Leather Goods","Full-Time","",False,"Mid"),
    ("EMP-016","Fatima Al-Hassan",  "Client Advisor",        "Selling Team", "STR-001","2023-09-11","F","English,Arabic","Jewelry & Watches","Full-Time","",False,"Junior"),
    ("EMP-017","Camille Laurent",   "Client Advisor",        "Selling Team", "STR-001","2024-01-15","F","English,French","Ready-to-Wear","Full-Time","",False,"Junior"),
    ("EMP-018","Carlos Rivera",     "Client Advisor",        "Selling Team", "STR-001","2023-11-01","M","English,Spanish","Leather Goods","Full-Time","",False,"Junior"),
    ("EMP-019","Emma Johnson",      "Client Host",           "Back Office",  "STR-001","2021-05-10","F","English","All Categories","Full-Time","",False,"Mid"),
    ("EMP-020","Oliver Grant",      "Visual Merchandiser",   "Back Office",  "STR-001","2020-09-01","M","English","All Categories","Full-Time","",False,"Mid"),
    ("EMP-021","Yuki Tanaka",       "Visual Merchandiser",   "Back Office",  "STR-001","2022-03-14","F","English,Japanese","All Categories","Full-Time","",False,"Mid"),
    ("EMP-022","Hassan Okafor",     "Stock Associate",       "Back Office",  "STR-001","2023-07-01","M","English","All Categories","Full-Time","",False,"Junior"),
]
emp_cols = ["employee_id","name","job_title","macro_group","store_id","hire_date","gender",
            "language_skills","speciality","schedule_type","days_off_this_week",
            "on_vacation","performance_tier"]
df_emp = pd.DataFrame(employees, columns=emp_cols)

# ── EVENTS ────────────────────────────────────────────────────────────────────
events = [
    ("EVT-001","SS25 VIP Preview — RTW & Accessories","2025-05-27","VIP",35,
     "Top Tier, High Potential","STR-001",
     "EMP-001,EMP-002,EMP-003,EMP-004,EMP-005,EMP-009,EMP-013,EMP-015,EMP-019",
     "Evening cocktail event. Multilingual staff required. Champagne service.",
     "Ready-to-Wear,Accessories,Jewelry & Watches"),
    ("EVT-002","Men's FW25 Trunk Show","2025-06-10","VIP",20,
     "High Potential, Repeater 10K+","STR-001",
     "EMP-001,EMP-004,EMP-007,EMP-009,EMP-022",
     "Focus on Men's RTW and Leather Goods.",
     "Ready-to-Wear,Leather Goods"),
    ("EVT-003","New CA Onboarding Training","2025-06-03","Training",0,"Staff","STR-001",
     "EMP-001,EMP-002,EMP-017,EMP-018",
     "Product knowledge and clienteling SOP training.",
     "All Categories"),
    ("EVT-004","Summer Animation — Gifts","2025-07-04","Animation",0,"All Segments","STR-001",
     "EMP-020,EMP-021",
     "In-store display animation for summer gifting.",
     "Fragrances,Accessories"),
    ("EVT-005","Top Tier Client Dinner","2025-07-15","VIP",12,"Top Tier","STR-001",
     "EMP-001,EMP-003,EMP-011",
     "Exclusive dinner for top 12 clients.",
     "All Categories"),
    ("EVT-006","Inventory & Operations Audit","2025-05-22","Operations",0,"Staff","STR-001",
     "EMP-002,EMP-022",
     "Monthly inventory reconciliation.",
     "All Categories"),
    ("EVT-007","High Potential Client Brunch","2025-08-05","VIP",18,"High Potential","STR-001",
     "EMP-002,EMP-005,EMP-007,EMP-019",
     "Informal brunch format.",
     "Ready-to-Wear,Accessories"),
    ("EVT-008","Summer Sale Launch","2025-05-17","Animation",0,"All Segments","STR-001",
     "EMP-020,EMP-021,EMP-001",
     "Summer sale floor setup and display refresh.",
     "All Categories"),
]
evt_cols = ["event_id","event_name","event_date","event_type","expected_clients",
            "target_segment","store_id","assigned_staff","notes","category_focus"]
df_evt = pd.DataFrame(events, columns=evt_cols)

# ── INVENTORY ─────────────────────────────────────────────────────────────────
inv_rows = []
sc = 1
def sku(name,cat,gender,color,size,price,stock,mtd,ly_sold,reorder,restock,season,hero,vip,store_id="STR-001"):
    global sc
    inv_rows.append((f"SKU-{sc:03d}",name,cat,gender,color,size,price,stock,mtd,ly_sold,reorder,restock,season,hero,vip,store_id))
    sc+=1

sku("Neverfull MM Monogram","Leather Goods","Women","Monogram","MM",1820,3,8,12,5,"2025-04-10","Core",True,True)
sku("Speedy Bandoulière 25","Leather Goods","Women","Monogram","25",1500,4,6,10,5,"2025-04-10","Core",True,False)
sku("Capucines MM Noir","Leather Goods","Women","Black","MM",5800,6,3,5,3,"2025-03-20","Core",True,True)
sku("Pochette Métis Monogram","Leather Goods","Women","Monogram","OS",2200,5,5,8,4,"2025-04-15","Core",True,False)
sku("OnTheGo GM Monogram","Leather Goods","Women","Monogram","GM",3100,7,4,6,4,"2025-05-01","SS25",False,False)
sku("Keepall Bandoulière 55","Leather Goods","Men","Monogram","55",2400,9,5,7,4,"2025-04-20","Core",False,False)
sku("District PM Damier Graphite","Leather Goods","Men","Graphite","PM",1680,8,4,6,4,"2025-04-20","Core",False,False)
sku("Twist MM Epi Noir","Leather Goods","Women","Black","MM",4200,5,2,4,3,"2025-03-15","Core",False,True)
sku("Alma BB Vernis Rose","Leather Goods","Women","Rose","BB",1980,6,3,5,3,"2025-04-01","Core",False,False)
sku("Zippy Wallet Monogram","Leather Goods","Women","Monogram","OS",760,12,7,10,6,"2025-05-05","Core",False,False)
sku("SS25 Silk Wrap Dress Ivory","Ready-to-Wear","Women","Ivory","S",3800,6,1,3,3,"2025-03-01","SS25",True,True)
sku("SS25 Silk Wrap Dress Ivory","Ready-to-Wear","Women","Ivory","M",3800,7,2,4,3,"2025-03-01","SS25",True,True)
sku("SS25 Monogram Blazer","Ready-to-Wear","Women","Monogram","38",4200,6,2,4,2,"2025-03-10","SS25",True,False)
sku("SS25 Linen Wide-Leg Trousers","Ready-to-Wear","Women","Ecru","38",1980,7,3,4,3,"2025-04-01","SS25",False,False)
sku("SS25 Men's Damier Shirt","Ready-to-Wear","Men","Brown","M",2200,6,1,3,2,"2025-04-10","SS25",False,True)
sku("LV Trainer Sneaker White","Shoes","Men","White","42",1180,8,4,6,4,"2025-04-15","Core",True,False)
sku("Archlight Sneaker Women","Shoes","Women","White","38",1080,7,3,5,3,"2025-04-10","Core",False,False)
sku("SS25 Mule Monogram","Shoes","Women","Monogram","37",1350,6,2,3,3,"2025-03-20","SS25",False,True)
sku("LV Loafer Men Glazed Calf","Shoes","Men","Black","42",980,4,2,3,3,"2025-04-20","Core",False,False)
sku("Acanthus Chain Bracelet Gold","Accessories","Women","Gold","OS",1850,4,1,3,3,"2025-03-15","Core",True,True)
sku("Monogram Bandeau Silk","Accessories","Women","Monogram","OS",390,18,8,12,8,"2025-05-01","SS25",False,True)
sku("SS25 Raffia Hat","Accessories","Women","Natural","OS",680,14,5,7,5,"2025-04-15","SS25",False,False)
sku("Empreinte Blossom Earrings YG","Jewelry & Watches","Women","Yellow Gold","OS",2800,3,1,2,2,"2025-02-20","Core",True,True)
sku("Tambour Street Diver Watch","Jewelry & Watches","Men","Steel","OS",5400,2,0,1,2,"2025-01-15","Core",True,True)
sku("LV Volt One Pendant","Jewelry & Watches","Women","Yellow Gold","OS",2200,3,1,2,2,"2025-02-10","Core",False,True)
for fname,fg in [("Coeur Battant","Women"),("Rose des Vents","Women"),("L'Immensite","Men"),
    ("Imagination","Men"),("Ombre Nomade","Unisex"),("Afternoon Swim","Unisex")]:
    p = random.choice([280,320,350,380,420])
    sku(f"{fname} EDP 100ml","Fragrances",fg,"N/A","100ml",p,
        random.randint(4,8),random.randint(2,5),random.randint(3,7),4,"2025-04-01","Core",False,False)

inv_cols = ["sku_id","product_name","category","gender","color","size","retail_price",
            "units_in_stock","units_sold_mtd","units_sold_ly","reorder_point",
            "last_restock","season","is_hero_product","is_vip_selection","store_id"]
df_inv = pd.DataFrame(inv_rows, columns=inv_cols)

# ── NPS ───────────────────────────────────────────────────────────────────────
nps_rows = []
for store in stores:
    sid = store[0]
    base_nps = random.randint(62, 82)
    for dept in departments:
        did = dept[0]
        store_nps = base_nps + random.randint(-8, 8)
        promoters = random.randint(55, 75)
        passives   = random.randint(10, 20)
        detractors = 100 - promoters - passives
        nps_rows.append((
            f"NPS-{sid}-{did}",
            sid, did,
            store_nps,
            promoters, passives, detractors,
            random.randint(18, 45),
            DEMO_TODAY.strftime("%Y-%m-%d"),
        ))
nps_cols = ["nps_id","store_id","dept_id","nps_score","promoters_pct","passives_pct",
            "detractors_pct","response_count","period_date"]
df_nps = pd.DataFrame(nps_rows, columns=nps_cols)

# ── ORDERS ────────────────────────────────────────────────────────────────────
order_statuses = ["Ready","Pulling","Pending","Overdue"]
order_rows = []
for store in stores:
    sid = store[0]
    n_orders = random.randint(8, 28)
    for i in range(n_orders):
        status = np.random.choice(order_statuses, p=[0.35, 0.25, 0.30, 0.10])
        dept = random.choice(departments)
        order_rows.append((
            f"ORD-{sid}-{i+1:03d}",
            sid,
            dept[0],
            f"Customer {random.randint(1000,9999)}",
            random.choice(["Online","App","Phone"]),
            status,
            DEMO_TODAY.strftime("%Y-%m-%d"),
            f"{random.randint(9,18)}:{random.randint(0,59):02d}",
            round(random.uniform(200, 3500), -1),
        ))
order_cols = ["order_id","store_id","dept_id","customer_name","order_channel",
              "status","order_date","pickup_time","order_value"]
df_orders = pd.DataFrame(order_rows, columns=order_cols)

# ── TASKS (for associates) ────────────────────────────────────────────────────
task_templates = [
    ("Morning floor check", "routine", "Done"),
    ("Restock display area", "routine", "Done"),
    ("Process pickup orders", "orders", "Pending"),
    ("Inventory count", "inventory", "Pending"),
    ("End-of-day report", "routine", "Pending"),
    ("Update shelf labels", "event", "Pending"),
    ("VIP client follow-up calls", "clienteling", "Pending"),
    ("Reset display for promotion", "event", "Overdue"),
    ("Low stock reorder request", "inventory", "Pending"),
    ("Floor walk & tidy", "routine", "Done"),
]
task_rows = []
t_id = 1
for emp in employees:
    if emp[3] == "Selling Team":
        for task in random.sample(task_templates, 5):
            task_rows.append((
                f"TASK-{t_id:04d}",
                emp[0],
                emp[4],
                task[0],
                task[1],
                task[2],
                DEMO_TODAY.strftime("%Y-%m-%d"),
                f"{random.randint(9,18)}:00",
            ))
            t_id += 1
task_cols = ["task_id","employee_id","store_id","task_name","task_type",
             "status","due_date","due_time"]
df_tasks = pd.DataFrame(task_rows, columns=task_cols)

# ── STORE KPIs (aggregated per store per day — for executive/region views) ────
kpi_rows = []
for store in stores:
    sid = store[0]
    rid = store[2]
    sqft = store[5]
    # Sales scale by store size
    base_daily = sqft * 1.8
    for day_offset in range(20):
        d = date(2025, 5, 1) + timedelta(days=day_offset)
        is_we = d.weekday() >= 5
        mult = 1.4 if is_we else 1.0
        ty_sales = round(base_daily * mult * random.uniform(0.85, 1.15), -1)
        ly_sales = round(base_daily * mult * random.uniform(0.90, 1.10), -1)
        kpi_rows.append((
            f"KPI-{sid}-{d.strftime('%Y%m%d')}",
            sid, rid,
            d.strftime("%Y-%m-%d"),
            ty_sales, ly_sales,
            round(ty_sales / random.uniform(8, 18), 0),  # transactions
            round(ty_sales / random.uniform(1200, 4500), 1),  # UPT approx
            random.randint(58, 88),  # NPS
            random.randint(60, 95),  # stock level pct
            random.randint(5, 35),   # orders
        ))
kpi_cols = ["kpi_id","store_id","region_id","date","sales_ty","sales_ly",
            "transactions","upt","nps_score","stock_level_pct","order_count"]
df_kpi = pd.DataFrame(kpi_rows, columns=kpi_cols)

# ── TRANSACTIONS (keep existing logic for STR-001) ────────────────────────────
cats    = ["Leather Goods","Ready-to-Wear","Shoes","Accessories","Jewelry & Watches","Fragrances"]
cat_w   = [0.35, 0.20, 0.18, 0.12, 0.08, 0.07]
cat_p   = {"Leather Goods":(1400,5500),"Ready-to-Wear":(1600,8500),
           "Shoes":(900,2800),"Accessories":(450,1800),
           "Jewelry & Watches":(2200,22000),"Fragrances":(280,520)}
segs    = ["Top Tier","High Potential","Repeater 10K+","Repeater","One-Timer"]
seg_w   = [0.05,0.10,0.15,0.30,0.40]
locs    = ["Local","Non-Local","International"]
loc_w   = [0.45,0.35,0.20]
gens    = ["Gen Z","Millennial","Gen X","Boomer"]
gen_w   = [0.15,0.40,0.30,0.15]
sell_emp = [e[0] for e in employees if e[3]=="Selling Team"]
sell_ttl = {e[0]:e[2] for e in employees if e[3]=="Selling Team"}

def season(m):
    if m<=3: return "Core"
    if m<=8: return "SS25"
    if m<=10: return "FW24"
    return "Holiday"

txn_rows = []
def gen_txns(start,end,daily_lo,daily_hi,price_adj=None):
    cur=start
    while cur<=end:
        is_we=cur.weekday()>=5
        n=random.randint(int(daily_lo*(1.5 if is_we else 1.0)),
                         int(daily_hi*(1.5 if is_we else 1.0)))
        for _ in range(n):
            cat=np.random.choice(cats,p=cat_w)
            plo,phi=cat_p[cat]
            adj=price_adj.get(cat,1.0) if price_adj else 1.0
            price=round(np.random.uniform(plo*adj,phi*adj),-1)
            price=max(price,plo*0.9)
            emp=random.choice(sell_emp)
            txn_rows.append({
                "transaction_id":"",
                "dream_id":f"CLT-{random.randint(1,300):03d}",
                "transaction_date":cur.strftime("%Y-%m-%d"),
                "transaction_year":cur.year,
                "transaction_month":cur.month,
                "transaction_hour":random.randint(10,20),
                "turnover_usd":price,
                "units":random.randint(1,3) if cat!="Fragrances" else random.randint(1,4),
                "category":cat,
                "gender":np.random.choice(["Women","Men"],p=[0.62,0.38]),
                "is_appointment":int(random.random()<0.32),
                "client_segment":np.random.choice(segs,p=seg_w),
                "client_location":np.random.choice(locs,p=loc_w),
                "salesperson_id":emp,
                "job_title":sell_ttl[emp],
                "generation":np.random.choice(gens,p=gen_w),
                "sale_type":"Normal Sale",
                "season_animation":season(cur.month),
                "store_id":"STR-001",
            })
        cur+=timedelta(days=1)

gen_txns(date(2024,1,1),date(2024,12,31),12,18)
gen_txns(date(2025,1,1),DEMO_TODAY,11,16,
         price_adj={"Ready-to-Wear":0.87,"Leather Goods":1.10})

df_txn=pd.DataFrame(txn_rows)
df_txn["transaction_id"]=[f"TXN-{i+1:05d}" for i in range(len(df_txn))]

# Validate
ty=df_txn[(df_txn.transaction_year==2025)&(df_txn.transaction_month==5)]
ly=df_txn[(df_txn.transaction_year==2024)&(df_txn.transaction_month==5)&
          (df_txn.transaction_date<="2024-05-20")]
ts,ls=ty.turnover_usd.sum(),ly.turnover_usd.sum()
print(f"\n📊 Flagship store (STR-001) MTD:")
print(f"  Sales TY: ${ts:,.0f}  LY: ${ls:,.0f}  vs LY: {(ts/ls-1)*100:+.1f}%")

# ── WRITE TO SQLITE ───────────────────────────────────────────────────────────
conn=sqlite3.connect(DB_PATH)
df_txn.to_sql("transactions",conn,if_exists="replace",index=False)
df_emp.to_sql("employees",conn,if_exists="replace",index=False)
df_inv.to_sql("inventory",conn,if_exists="replace",index=False)
df_evt.to_sql("events",conn,if_exists="replace",index=False)
df_regions.to_sql("regions",conn,if_exists="replace",index=False)
df_stores.to_sql("stores",conn,if_exists="replace",index=False)
df_depts.to_sql("departments",conn,if_exists="replace",index=False)
df_nps.to_sql("nps",conn,if_exists="replace",index=False)
df_orders.to_sql("orders",conn,if_exists="replace",index=False)
df_tasks.to_sql("tasks",conn,if_exists="replace",index=False)
df_kpi.to_sql("store_kpis",conn,if_exists="replace",index=False)
conn.close()

print(f"\n✅  storeiq.db v2 ready!")
print(f"   transactions: {len(df_txn):,}")
print(f"   regions:      {len(df_regions)}")
print(f"   stores:       {len(df_stores)}")
print(f"   departments:  {len(df_depts)}")
print(f"   employees:    {len(df_emp)}")
print(f"   inventory:    {len(df_inv)}")
print(f"   events:       {len(df_evt)}")
print(f"   nps:          {len(df_nps)}")
print(f"   orders:       {len(df_orders)}")
print(f"   tasks:        {len(df_tasks)}")
print(f"   store_kpis:   {len(df_kpi)}")