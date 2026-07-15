# ============================================================
# MjengoSmart — Seed Data Management Command
# Creates realistic Kenyan construction demo data
# Run: python manage.py seed_data
# ============================================================

import random
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password

from users.models         import User
from suppliers.models     import Supplier
from materials.models     import Material
from orders.models        import Worker, Order, BookingRequest
from reviews.models       import Review
from notifications.models import Notification


# ── Kenyan Nairobi area coordinates ──────────────────────────

NAIROBI_LOCATIONS = [
    ('Westlands',       -1.2676, 36.8108),
    ('Kilimani',        -1.2897, 36.7892),
    ('Ngong Road',      -1.3167, 36.7800),
    ('Thika Road',      -1.2200, 36.8700),
    ('Eastleigh',       -1.2731, 36.8474),
    ('South B',         -1.3108, 36.8280),
    ('Karen',           -1.3183, 36.7100),
    ('Ruaka',           -1.1972, 36.7692),
    ('Kikuyu',          -1.2467, 36.6644),
    ('Athi River',      -1.4560, 36.9782),
    ('Kasarani',        -1.2217, 36.8950),
    ('Embakasi',        -1.3178, 36.9000),
    ('Lang\'ata',       -1.3617, 36.7408),
    ('Lavington',       -1.2742, 36.7731),
    ('Parklands',       -1.2583, 36.8147),
]

SUPPLIER_NAMES = [
    'Kamau Hardware & Supplies',
    'Wanjiku Building Materials',
    'Ochieng Brothers Hardware',
    'Nyambura Construction Supplies',
    'Kariuki & Sons Hardware',
    'Mwangi Timber Merchants',
    'Achieng Steel Fabricators',
    'Njoroge Cement Distributors',
    'Kimani Roofing Materials',
    'Otieno General Hardware',
    'Chebet Sand & Ballast',
    'Koech Tiles & Ceramics',
    'Rono Electrical Supplies',
    'Chepkemoi Plumbing Supplies',
    'Mutai Building Solutions',
]

WORKER_NAMES = [
    ('James',   'Otieno'),
    ('Peter',   'Mutua'),
    ('John',    'Kamau'),
    ('Samuel',  'Ochieng'),
    ('David',   'Mwangi'),
    ('Michael', 'Kariuki'),
    ('Joseph',  'Njoroge'),
    ('Daniel',  'Kimani'),
    ('Paul',    'Waweru'),
    ('Charles', 'Gitau'),
    ('Grace',   'Wanjiku'),
    ('Mary',    'Achieng'),
    ('Faith',   'Chebet'),
    ('Ruth',    'Koech'),
    ('Esther',  'Mutai'),
]

MATERIAL_DATA = [
    # (name, category, price, unit, description)
    ('Portland Cement (50kg)',    'Cement',     780,  'bag',    'Standard OPC cement, suitable for all construction'),
    ('Rhino Cement (50kg)',       'Cement',     760,  'bag',    'High-strength cement for foundations'),
    ('Bamburi Cement (50kg)',     'Cement',     800,  'bag',    'Premium quality Portland cement'),
    ('Steel Rebar Y12 (12mm)',    'Steel',      950,  'length', '12m deformed steel bar for reinforced concrete'),
    ('Steel Rebar Y16 (16mm)',    'Steel',      1600, 'length', '16mm high-tensile deformed bar'),
    ('BRC Mesh A142',             'Steel',      2800, 'sheet',  'Steel fabric mesh for floor slabs'),
    ('Cypress Timber 2"×4"',      'Timber',     550,  'length', 'Treated cypress timber for formwork and roofing'),
    ('Mahogany Door Frame',       'Timber',     3500, 'set',    'Hardwood door frame, fully treated'),
    ('Roofing Timber 2"×3"',      'Timber',     380,  'length', 'Kiln-dried timber for purlins'),
    ('River Sand (washed)',       'Sand',       2800, 'tonne',  'Clean washed river sand for concrete and plaster'),
    ('Crushed Stone Ballast',     'Sand',       2200, 'tonne',  '20mm crushed ballast for concrete mix'),
    ('Hardcore Fill',             'Sand',       1800, 'tonne',  'Hardcore for ground filling and levelling'),
    ('Iron Sheets 28G (8ft)',     'Roofing',    720,  'sheet',  'Galvanised corrugated iron sheets'),
    ('Iron Sheets 30G (10ft)',    'Roofing',    850,  'sheet',  'Gauge 30 long-span roofing sheets'),
    ('Ridge Cap (coloured)',      'Roofing',    380,  'piece',  'Coloured ridge capping for roof finish'),
    ('Ceramic Floor Tiles 60×60', 'Tiles',      85,   'piece',  'Vitrified ceramic floor tiles'),
    ('Porcelain Wall Tiles 30×60','Tiles',      120,  'piece',  'Glossy porcelain wall tiles for bathrooms'),
    ('Anti-slip Outdoor Tiles',   'Tiles',      95,   'piece',  'Textured anti-slip tiles for outdoor use'),
    ('Crown Paint (20L)',         'Paint',      4800, 'tin',    'Premium interior emulsion paint'),
    ('Sadolin Woodstain (5L)',    'Paint',      2200, 'tin',    'Protective wood stain and varnish'),
    ('Metal Primer (5L)',         'Paint',      1800, 'tin',    'Rust-inhibiting metal primer'),
    ('PVC Conduit Pipe 20mm',     'Electrical', 180,  'length', '3m PVC conduit pipe for electrical wiring'),
    ('MCB Circuit Breaker 32A',   'Electrical', 850,  'piece',  'Single-pole miniature circuit breaker'),
    ('2.5mm² Copper Cable (100m)','Electrical', 6500, 'roll',   'PVC insulated copper wire for power circuits'),
    ('PPR Pipe 25mm (4m)',        'Plumbing',   420,  'length', 'Polypropylene random pipe for hot/cold water'),
    ('PVC Soil Pipe 110mm',       'Plumbing',   680,  'length', '3m PVC soil and waste pipe'),
    ('Gate Valve 1/2"',           'Plumbing',   350,  'piece',  'Brass gate valve for water control'),
]


class Command(BaseCommand):
    help = 'Seeds the database with realistic Kenyan construction demo data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Notification.objects.all().delete()
            Review.objects.all().delete()
            BookingRequest.objects.all().delete()
            Order.objects.all().delete()
            Material.objects.all().delete()
            Worker.objects.filter(user__username__startswith='worker_').delete()
            Supplier.objects.filter(user__username__startswith='supplier_').delete()
            User.objects.filter(
                username__startswith='worker_'
            ).delete()
            User.objects.filter(
                username__startswith='supplier_'
            ).delete()
            User.objects.filter(
                username__startswith='client_'
            ).delete()

        self.stdout.write('🌱 Seeding MjengoSmart demo data...')

        # ── Create demo clients ───────────────────────────────
        clients = []
        client_data = [
            ('james.builder',  'James',  'Otieno',  'jotieno@demo.com'),
            ('grace.client',   'Grace',  'Wanjiku', 'gwanjiku@demo.com'),
            ('peter.homeowner','Peter',  'Mwangi',  'pmwangi@demo.com'),
            ('client_4',       'Sarah',  'Chebet',  'schebet@demo.com'),
            ('client_5',       'Moses',  'Kariuki', 'mkariuki@demo.com'),
        ]

        for uname, fname, lname, email in client_data:
            user, _ = User.objects.get_or_create(
                username=uname,
                defaults={
                    'email':      email,
                    'first_name': fname,
                    'last_name':  lname,
                    'role':       'client',
                    'password':   make_password('Demo1234!'),
                    'latitude':   -1.2921,
                    'longitude':  36.8219,
                    'location_name': 'Nairobi CBD',
                }
            )
            clients.append(user)

        self.stdout.write(f'  ✓ Created {len(clients)} client users')

        # ── Create suppliers ──────────────────────────────────
        suppliers = []
        for i, (name, (loc_name, lat, lng)) in enumerate(
            zip(SUPPLIER_NAMES, NAIROBI_LOCATIONS)
        ):
            username = f'supplier_{i+1}'
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email':       f'{username}@mjengosmart.co.ke',
                    'first_name':  name.split()[0],
                    'last_name':   name.split()[-1],
                    'role':        'supplier',
                    'password':    make_password('Demo1234!'),
                    'location_name': loc_name,
                    'latitude':    lat,
                    'longitude':   lng,
                }
            )

            supplier, _ = Supplier.objects.get_or_create(
                user=user,
                defaults={
                    'business_name': name,
                    'description':   (
                        f'Trusted hardware supplier in {loc_name}. '
                        f'Serving the Kenyan construction sector since '
                        f'{2005 + i}. Quality materials at competitive prices.'
                    ),
                    'address':       f'{loc_name}, Nairobi, Kenya',
                    'latitude':      lat,
                    'longitude':     lng,
                    'phone':         f'+2547{random.randint(10000000, 99999999)}',
                    'email':         f'info@{username}.co.ke',
                    'opening_hours': 'Mon–Sat: 7:00am – 6:00pm',
                    'is_open_now':   True,
                    'rating':        round(random.uniform(3.8, 5.0), 1),
                }
            )
            suppliers.append(supplier)

        self.stdout.write(f'  ✓ Created {len(suppliers)} suppliers')

        # ── Create materials ──────────────────────────────────
        materials_created = []
        for i, (mname, category, price, unit, desc) in enumerate(MATERIAL_DATA):
            # Distribute materials across suppliers
            supplier = suppliers[i % len(suppliers)]
            mat, _   = Material.objects.get_or_create(
                name=mname,
                supplier=supplier,
                defaults={
                    'description':    desc,
                    'category':       category,
                    'price':          price + random.randint(-50, 100),
                    'unit':           unit,
                    'stock_quantity': random.randint(20, 500),
                }
            )
            materials_created.append(mat)

            # Add 2-3 more of same category from different suppliers
            for j in range(random.randint(1, 3)):
                sup2 = suppliers[(i + j + 1) % len(suppliers)]
                Material.objects.get_or_create(
                    name=mname,
                    supplier=sup2,
                    defaults={
                        'description':    desc,
                        'category':       category,
                        'price':          price + random.randint(-80, 150),
                        'unit':           unit,
                        'stock_quantity': random.randint(10, 300),
                    }
                )

        self.stdout.write(f'  ✓ Created {Material.objects.count()} materials')

        # ── Create workers ────────────────────────────────────
        skill_types = [
            'Mason', 'Plumber', 'Electrician', 'Carpenter',
            'Painter', 'Welder', 'Tiler', 'Roofer',
            'General Labour', 'Supervisor',
        ]
        workers = []

        for i, (fname, lname) in enumerate(WORKER_NAMES):
            username = f'worker_{i+1}'
            loc_name, lat, lng = NAIROBI_LOCATIONS[i % len(NAIROBI_LOCATIONS)]
            skill    = skill_types[i % len(skill_types)]

            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email':         f'{username}@mjengosmart.co.ke',
                    'first_name':    fname,
                    'last_name':     lname,
                    'role':          'worker',
                    'password':      make_password('Demo1234!'),
                    'location_name': loc_name,
                    'latitude':      lat,
                    'longitude':     lng,
                }
            )

            daily_rates = {
                'Supervisor':     3500,
                'Electrician':    3000,
                'Plumber':        2800,
                'Mason':          2500,
                'Carpenter':      2500,
                'Welder':         2800,
                'Roofer':         2200,
                'Tiler':          2000,
                'Painter':        1800,
                'General Labour': 1200,
            }

            worker, _ = Worker.objects.get_or_create(
                user=user,
                defaults={
                    'skill_type':       skill,
                    'bio': (
                        f'Experienced {skill} based in {loc_name} '
                        f'with {5 + i} years of professional experience '
                        f'in residential and commercial construction across Nairobi.'
                    ),
                    'daily_rate':       daily_rates.get(skill, 2000)
                                        + random.randint(-200, 500),
                    'experience_years': random.randint(3, 20),
                    'latitude':         lat + random.uniform(-0.02, 0.02),
                    'longitude':        lng + random.uniform(-0.02, 0.02),
                    'location_name':    loc_name,
                    'rating':           round(random.uniform(3.5, 5.0), 1),
                    'is_available':     random.choice([True, True, True, False]),
                }
            )
            workers.append(worker)

        self.stdout.write(f'  ✓ Created {len(workers)} workers')

        # ── Create sample orders ──────────────────────────────
        statuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled']
        orders   = []

        for i in range(20):
            client   = clients[i % len(clients)]
            material = materials_created[i % len(materials_created)]
            qty      = random.randint(1, 50)

            order = Order.objects.create(
                client=client,
                material=material,
                quantity=qty,
                total_price=qty * material.price,
                status=random.choice(statuses),
                delivery_address=f'{NAIROBI_LOCATIONS[i % len(NAIROBI_LOCATIONS)][0]}, Nairobi',
                notes='Please deliver in the morning before 10am.',
            )
            orders.append(order)

        self.stdout.write(f'  ✓ Created {len(orders)} orders')

        # ── Create booking requests ───────────────────────────
        booking_statuses = ['pending', 'accepted', 'declined', 'completed']

        for i in range(15):
            import datetime
            start = datetime.date.today() + datetime.timedelta(
                days=random.randint(-10, 30)
            )
            end   = start + datetime.timedelta(days=random.randint(1, 14))

            BookingRequest.objects.create(
                client=clients[i % len(clients)],
                worker=workers[i % len(workers)],
                start_date=start,
                end_date=end,
                description=(
                    f'Need a skilled {workers[i % len(workers)].skill_type} '
                    f'for residential construction work in Nairobi. '
                    f'Project involves standard construction tasks. '
                    f'Materials will be provided on site.'
                ),
                agreed_rate=workers[i % len(workers)].daily_rate,
                status=random.choice(booking_statuses),
            )

        self.stdout.write(f'  ✓ Created booking requests')

        # ── Create reviews ────────────────────────────────────
        review_comments = [
            'Excellent service! Fast delivery and quality materials.',
            'Good quality materials at fair prices. Will use again.',
            'Very professional and reliable. Highly recommended.',
            'Materials arrived on time and in perfect condition.',
            'Great value for money. The team is very knowledgeable.',
            'Delivered exactly what was ordered. No complaints.',
            'Slightly delayed but good quality overall.',
            'Outstanding service. The best hardware supplier in Nairobi.',
        ]

        for i, supplier in enumerate(suppliers[:8]):
            client = clients[i % len(clients)]
            try:
                Review.objects.get_or_create(
                    reviewer=client,
                    target_type='supplier',
                    target_id=supplier.id,
                    defaults={
                        'rating':  random.randint(4, 5),
                        'comment': review_comments[i % len(review_comments)],
                    }
                )
            except Exception:
                pass

        worker_comments = [
            'Very skilled mason. Finished the job ahead of schedule.',
            'Professional plumber. Fixed the issue quickly and cleanly.',
            'Excellent electrician. Work is neat and up to standard.',
            'Hard-working and reliable. Will definitely hire again.',
            'Skilled carpenter with great attention to detail.',
        ]

        for i, worker in enumerate(workers[:5]):
            client = clients[i % len(clients)]
            try:
                Review.objects.get_or_create(
                    reviewer=client,
                    target_type='worker',
                    target_id=worker.id,
                    defaults={
                        'rating':  random.randint(4, 5),
                        'comment': worker_comments[i % len(worker_comments)],
                    }
                )
            except Exception:
                pass

        self.stdout.write(f'  ✓ Created reviews')

        # ── Create notifications ──────────────────────────────
        for client in clients:
            Notification.objects.get_or_create(
                user=client,
                title='Welcome to MjengoSmart!',
                defaults={
                    'notif_type': 'system',
                    'message': (
                        'Welcome to Kenya\'s integrated construction platform. '
                        'Browse suppliers, estimate material costs, and hire '
                        'verified fundis near you.'
                    ),
                }
            )

        self.stdout.write('  ✓ Created welcome notifications')

        # ── Summary ───────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            '\n✅ MjengoSmart seed data complete!\n'
            f'   Users:      {User.objects.count()}\n'
            f'   Suppliers:  {Supplier.objects.count()}\n'
            f'   Materials:  {Material.objects.count()}\n'
            f'   Workers:    {Worker.objects.count()}\n'
            f'   Orders:     {Order.objects.count()}\n'
            f'   Bookings:   {BookingRequest.objects.count()}\n'
            f'   Reviews:    {Review.objects.count()}\n'
            '\nDemo login credentials:\n'
            '   Client:   james.builder / Demo1234!\n'
            '   Supplier: supplier_1 / Demo1234!\n'
            '   Worker:   worker_1 / Demo1234!\n'
        ))