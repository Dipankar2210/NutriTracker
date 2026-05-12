# Food Table Reference

This file is the app's starting reference for common meals, geography, staple ingredients, average adult meal quantities, and estimated nutrition configuration.

Use it as a decision-support reference when AI analyzes an uploaded meal photo. Do not treat this table as final truth. Meals vary by recipe, portion size, cooking oil, restaurant style, and user location.

## Source Basis

- Nutrition values should be checked against [USDA FoodData Central](https://fdc.nal.usda.gov/) or another trusted food database before being shown as final.
- Regional staple assumptions are informed by FAO staple-food guidance and food-based dietary guidance:
  - [FAO staple foods](https://www.fao.org/3/u8480e/u8480e07.htm)
  - [FAO basic foodstuffs](https://www.fao.org/4/y4343e/y4343e02.htm)
  - [FAO food-based dietary guidelines](https://www.fao.org/nutrition/education/food-dietary-guidelines/regions/countries/en/)
- Serving and food-group assumptions should be aligned with USDA dietary pattern and MyPlate guidance:
  - [USDA Dietary Patterns](https://www.fns.usda.gov/cnpp/usda-dietary-patterns)
  - [USDA Dietary Health and MyPlate](https://www.usda.gov/about-food/nutrition-research-and-programs/dietary-health)
- Global dish examples are informed by public food references such as [TasteAtlas global dish lists](https://www.tasteatlas.com/best/dishes).

## How The App Should Use This File

1. Detect food items and quantities from the uploaded image using AI vision.
2. Match detected items against this table using meal name, staple ingredients, user location, and visual clues.
3. Use the matching row only as a starting estimate.
4. Ask the user to confirm or edit any unclear food item, quantity, or unit.
5. Recalculate nutrition totals after every user edit.
6. Save the reviewed meal by user, date, time, and meal type.

## Auto-Update Rule

When a registered user uploads a meal that is not represented in this file:

1. The user must be signed in.
2. The user must have provided location details.
3. The uploaded meal must be saved by the user after manual review.
4. The app may create a pending `foodtable.md` candidate entry using:
   - user location
   - detected food name
   - corrected ingredients
   - corrected quantity
   - trusted nutrition estimate
   - confidence level
5. The candidate entry should be reviewed before becoming canonical.
6. Anonymous users and users without location details must not update this table.
7. User names, personal health data, and uploaded photo URLs must not be written into this file.

## Nutrition Table Columns

- `Avg Qty` is a practical adult meal-size estimate.
- `Diet` means the usual configuration. It does not guarantee suitability for every user.
- `Kcal`, `Protein`, `Carbs`, `Fat`, `Fiber`, and `Sodium` are approximate per-meal estimates.
- `Micros / Notes` lists common micronutrient signals or estimation warnings.

| ID | Region / Location | Common Meal | Staple Food Items | Avg Qty | Diet | Kcal | Protein g | Carbs g | Fat g | Fiber g | Sodium mg | Micros / Notes |
|---:|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | India / South Asia | Dal rice | Lentils, rice, tempering oil | 1.5 cups rice + 1 cup dal | Vegetarian | 560 | 20 | 95 | 12 | 13 | 800 | Iron, folate, potassium; oil changes calories |
| 2 | India / South Asia | Chicken biryani | Rice, chicken, yogurt, spices | 2 cups biryani + raita | Omnivore | 780 | 36 | 88 | 30 | 4 | 1150 | B vitamins, iron; high sodium possible |
| 3 | India / South Asia | Vegetable biryani | Rice, vegetables, yogurt, spices | 2 cups biryani | Vegetarian | 620 | 14 | 96 | 21 | 7 | 1000 | Vitamin A, vitamin C; protein varies |
| 4 | India / South Asia | Roti sabzi dal | Wheat roti, vegetables, lentils | 2 rotis + 1 cup sabzi + 0.75 cup dal | Vegetarian | 610 | 22 | 88 | 18 | 15 | 850 | Fiber, iron, folate |
| 5 | South India | Idli sambar | Rice-lentil cakes, lentil stew | 3 idli + 1.5 cups sambar | Vegetarian | 430 | 16 | 78 | 7 | 9 | 900 | Fermented batter; sodium from sambar |
| 6 | South India | Dosa sambar chutney | Rice-lentil crepe, sambar, coconut chutney | 1 large dosa + sides | Vegetarian | 540 | 14 | 74 | 21 | 7 | 850 | Manganese, iron; fat from chutney/oil |
| 7 | India | Poha | Flattened rice, peas, peanuts | 2 cups | Vegetarian | 420 | 10 | 68 | 14 | 6 | 650 | Iron if fortified, vitamin C from lemon |
| 8 | India | Upma | Semolina, vegetables, oil | 2 cups | Vegetarian | 480 | 12 | 72 | 16 | 6 | 700 | B vitamins; oil raises fat |
| 9 | North India | Chole bhature | Chickpea curry, fried bread | 1.5 cups chole + 2 bhature | Vegetarian | 920 | 25 | 120 | 38 | 17 | 1350 | Iron, folate; fried, high sodium |
| 10 | North India | Rajma chawal | Kidney beans, rice | 1.5 cups rice + 1 cup rajma | Vegetarian | 650 | 22 | 112 | 10 | 16 | 850 | Potassium, iron, folate |
| 11 | India | Paneer curry rice | Paneer, tomato gravy, rice | 1 cup curry + 1.5 cups rice | Vegetarian | 760 | 27 | 82 | 36 | 5 | 950 | Calcium, protein; saturated fat varies |
| 12 | Coastal India | Fish curry rice | Fish, coconut/tomato curry, rice | 150 g fish + 1.5 cups rice | Pescatarian | 670 | 34 | 76 | 24 | 4 | 900 | Omega-3, iodine; sauce changes fat |
| 13 | India | Mutton curry roti | Mutton, gravy, wheat roti | 1 cup curry + 2 rotis | Omnivore | 780 | 38 | 58 | 40 | 6 | 1050 | Iron, zinc, B12; high fat possible |
| 14 | India | Khichdi | Rice, lentils, ghee, vegetables | 2 cups | Vegetarian | 520 | 18 | 82 | 14 | 10 | 650 | Easy-to-digest; ghee changes fat |
| 15 | India | Mixed thali | Rice, roti, dal, sabzi, curd | 1 plate | Vegetarian | 850 | 30 | 120 | 28 | 16 | 1300 | Broad nutrients; portion highly variable |
| 16 | North India | Aloo paratha curd | Stuffed wheat flatbread, yogurt | 2 parathas + 0.75 cup curd | Vegetarian | 720 | 22 | 92 | 30 | 9 | 950 | Calcium, potassium; ghee/oil important |
| 17 | West India | Pav bhaji | Bread rolls, mashed vegetable curry, butter | 2 pav + 1.5 cups bhaji | Vegetarian | 650 | 16 | 94 | 24 | 10 | 1200 | Vitamin C, potassium; butter raises fat |
| 18 | Himalayan / South Asia | Steamed momos | Wheat dumplings, vegetables or chicken | 8 pieces + sauce | Veg or omnivore | 520 | 22 | 70 | 16 | 5 | 1000 | Sodium from sauce; filling changes protein |
| 19 | Japan | Sushi set | Rice, fish, seaweed, soy sauce | 8 pieces | Pescatarian | 480 | 28 | 68 | 10 | 3 | 1200 | Omega-3, iodine; soy sauce high sodium |
| 20 | Japan | Ramen | Wheat noodles, broth, pork/egg | 1 large bowl | Omnivore | 750 | 32 | 86 | 28 | 5 | 1900 | B vitamins; sodium often high |
| 21 | Japan | Grilled fish rice set | Fish, rice, miso soup, vegetables | 150 g fish + 1 cup rice | Pescatarian | 610 | 38 | 58 | 20 | 5 | 1300 | Omega-3, iodine, vitamin D |
| 22 | Japan | Chicken donburi | Rice bowl, chicken, egg, sauce | 1 bowl | Omnivore | 680 | 34 | 82 | 22 | 4 | 1100 | B12, selenium; sauce sodium varies |
| 23 | Korea | Bibimbap | Rice, vegetables, egg, beef/tofu | 1 bowl | Flexible | 650 | 26 | 88 | 20 | 10 | 1000 | Vitamin A, iron; gochujang sodium |
| 24 | Korea | Kimchi jjigae rice | Kimchi stew, pork/tofu, rice | 1 bowl stew + 1 cup rice | Flexible | 620 | 28 | 72 | 23 | 7 | 1800 | Probiotic-style fermented food; high sodium |
| 25 | Korea | Bulgogi rice | Marinated beef, rice, vegetables | 150 g beef + 1 cup rice | Omnivore | 720 | 38 | 72 | 30 | 4 | 1250 | Iron, zinc; sugar in marinade |
| 26 | Korea | Japchae | Glass noodles, vegetables, beef/egg | 2 cups | Flexible | 560 | 18 | 82 | 18 | 5 | 900 | Vitamin A; protein depends on topping |
| 27 | China | Mapo tofu rice | Tofu, minced meat, chili bean sauce, rice | 1 cup mapo + 1 cup rice | Flexible | 670 | 28 | 68 | 30 | 5 | 1500 | Calcium, iron; sodium high |
| 28 | China | Fried rice | Rice, egg, vegetables, meat/shrimp | 2 cups | Flexible | 720 | 24 | 92 | 26 | 5 | 1300 | B vitamins; oil and soy sauce vary |
| 29 | China | Dumpling meal | Wheat dumplings, pork/veg filling | 10 pieces | Flexible | 620 | 26 | 72 | 24 | 5 | 1100 | Iron, choline; sauce adds sodium |
| 30 | China | Chow mein | Wheat noodles, vegetables, protein | 2 cups | Flexible | 760 | 28 | 96 | 28 | 7 | 1500 | Vitamin C if vegetable-heavy |
| 31 | China / East Asia | Congee with egg | Rice porridge, egg, meat or tofu | 2 cups congee + toppings | Flexible | 420 | 18 | 62 | 12 | 2 | 900 | Gentle meal; lower fiber unless veg added |
| 32 | East Asia | Hot pot meal | Broth, meat/tofu, vegetables, noodles | 1 shared bowl portion | Flexible | 800 | 42 | 70 | 36 | 9 | 1800 | High vegetable variety; broth sodium high |
| 33 | Japan | Bento box | Rice, protein, vegetables, pickles | 1 box | Flexible | 700 | 32 | 84 | 24 | 7 | 1300 | Balanced if vegetables are present |
| 34 | China | Peking duck pancakes | Duck, pancakes, sauce, cucumber | 6 pancakes | Omnivore | 820 | 36 | 72 | 42 | 4 | 1400 | Iron, B12; sauce and skin raise sodium/fat |
| 35 | Indonesia | Nasi goreng | Fried rice, egg, chicken/shrimp | 2 cups + egg | Flexible | 760 | 28 | 94 | 28 | 5 | 1350 | Sodium from kecap/sauce |
| 36 | Indonesia | Mie goreng | Fried noodles, egg, vegetables, protein | 2 cups | Flexible | 780 | 26 | 98 | 30 | 6 | 1500 | B vitamins; oil varies |
| 37 | Vietnam | Pho | Rice noodles, broth, beef/chicken, herbs | 1 large bowl | Omnivore | 620 | 36 | 78 | 14 | 4 | 1700 | Iron/B12; broth sodium high |
| 38 | Vietnam | Banh mi | Baguette, meat/tofu, pickles, sauce | 1 sandwich | Flexible | 620 | 28 | 72 | 24 | 5 | 1300 | Vitamin C from pickles/herbs |
| 39 | Thailand | Pad thai | Rice noodles, egg, tofu/shrimp, peanuts | 2 cups | Flexible | 760 | 30 | 92 | 28 | 6 | 1300 | Niacin, calcium if tofu; sugar varies |
| 40 | Thailand | Green curry rice | Coconut curry, chicken/tofu, rice | 1 cup curry + 1 cup rice | Flexible | 720 | 30 | 70 | 34 | 6 | 1100 | Vitamin A; coconut raises saturated fat |
| 41 | Thailand | Tom yum rice | Hot sour soup, shrimp/chicken, rice | 1.5 cups soup + 1 cup rice | Pescatarian or omnivore | 500 | 30 | 62 | 12 | 4 | 1500 | Vitamin C; sodium from broth |
| 42 | Thailand | Khao soi | Egg noodles, coconut curry, chicken | 1 bowl | Omnivore | 820 | 36 | 82 | 38 | 5 | 1450 | B vitamins; high fat from coconut/fried noodles |
| 43 | Malaysia / Singapore | Laksa | Rice noodles, coconut broth, seafood/tofu | 1 bowl | Flexible | 780 | 30 | 78 | 38 | 5 | 1600 | Iodine, selenium; sodium high |
| 44 | Southeast Asia | Chicken satay rice | Grilled chicken skewers, peanut sauce, rice | 4 skewers + 1 cup rice | Omnivore | 720 | 42 | 64 | 30 | 5 | 1050 | Niacin, magnesium from peanuts |
| 45 | Indonesia / Malaysia | Rendang rice | Beef coconut stew, rice | 1 cup rendang + 1 cup rice | Omnivore | 850 | 38 | 68 | 46 | 4 | 1150 | Iron, zinc; high saturated fat possible |
| 46 | Philippines | Chicken adobo rice | Chicken, soy-vinegar sauce, rice | 180 g chicken + 1 cup rice | Omnivore | 700 | 42 | 62 | 30 | 2 | 1500 | B12, selenium; sauce sodium high |
| 47 | Philippines | Sinigang rice | Sour soup, pork/fish, vegetables, rice | 1.5 cups soup + 1 cup rice | Flexible | 580 | 32 | 66 | 20 | 6 | 1400 | Vitamin C, potassium; sodium varies |
| 48 | Singapore / Hainan | Hainanese chicken rice | Poached chicken, seasoned rice, sauces | 180 g chicken + 1.25 cups rice | Omnivore | 760 | 40 | 82 | 28 | 3 | 1300 | Selenium; sauces affect sodium |
| 49 | Middle East | Hummus falafel pita | Chickpeas, tahini, falafel, pita | 1 pita + 4 falafel + hummus | Vegetarian | 760 | 24 | 86 | 36 | 15 | 1200 | Folate, iron, sesame calcium |
| 50 | Levant | Shawarma plate | Chicken/lamb, pita/rice, salad, sauce | 180 g meat + pita/rice | Omnivore | 850 | 46 | 72 | 40 | 6 | 1450 | Iron/B12; sauce/fat varies |
| 51 | Gulf | Kabsa | Spiced rice, chicken/lamb | 2 cups rice + 180 g meat | Omnivore | 880 | 44 | 96 | 32 | 5 | 1200 | B vitamins, iron; large portions common |
| 52 | Middle East | Kebab rice plate | Grilled meat, rice, salad | 180 g kebab + 1 cup rice | Omnivore | 760 | 46 | 60 | 36 | 5 | 1100 | Iron, zinc; fat depends on meat |
| 53 | North Africa / Middle East | Shakshuka bread | Eggs, tomato-pepper sauce, bread | 2 eggs + sauce + 2 slices bread | Vegetarian | 520 | 24 | 52 | 24 | 7 | 900 | Choline, vitamin C, lycopene |
| 54 | Middle East | Lentil soup pita | Lentils, vegetables, pita | 2 cups soup + 1 pita | Vegan | 520 | 24 | 86 | 9 | 18 | 1000 | Folate, iron, potassium |
| 55 | Morocco / North Africa | Couscous vegetables | Couscous, vegetables, chickpeas/meat | 2 cups | Flexible | 650 | 22 | 104 | 16 | 11 | 850 | Fiber, vitamin A; protein varies |
| 56 | Morocco | Chicken tagine couscous | Chicken, vegetables, dried fruit, couscous | 1.5 cups tagine + 1 cup couscous | Omnivore | 760 | 38 | 88 | 28 | 8 | 950 | Potassium, iron; fruit adds sugar |
| 57 | Egypt / Levant | Ful medames pita | Fava beans, oil, pita, vegetables | 1.5 cups ful + pita | Vegan | 680 | 28 | 104 | 18 | 22 | 1100 | Folate, iron, magnesium |
| 58 | Jordan / Levant | Mansaf | Lamb, rice, yogurt sauce | 180 g lamb + 1.5 cups rice | Omnivore | 950 | 48 | 86 | 46 | 3 | 1350 | Calcium, B12; high saturated fat possible |
| 59 | Levant | Tabbouleh chicken pita | Parsley salad, grilled chicken, pita | 150 g chicken + salad + pita | Omnivore | 580 | 42 | 54 | 18 | 9 | 850 | Vitamin K, vitamin C, iron |
| 60 | Mediterranean / MENA | Fattoush halloumi plate | Bread salad, halloumi, vegetables | 2 cups salad + 80 g cheese | Vegetarian | 560 | 24 | 42 | 32 | 8 | 1350 | Calcium, vitamin C; cheese sodium high |
| 61 | Italy | Pizza margherita | Wheat crust, tomato, mozzarella | 2 slices / 0.5 medium pizza | Vegetarian | 700 | 28 | 82 | 28 | 5 | 1300 | Calcium, lycopene; portion varies |
| 62 | Italy | Pasta bolognese | Pasta, meat sauce, tomato | 2 cups | Omnivore | 760 | 36 | 90 | 28 | 7 | 1000 | Iron, B12, lycopene |
| 63 | Italy | Lasagna | Pasta, meat/cheese sauce | 1 large square | Omnivore | 820 | 38 | 70 | 42 | 5 | 1250 | Calcium, iron; high saturated fat possible |
| 64 | Italy | Risotto | Arborio rice, cheese, stock, vegetables/meat | 2 cups | Flexible | 720 | 22 | 92 | 28 | 4 | 1100 | Calcium; stock sodium varies |
| 65 | United Kingdom | Fish and chips | Fried fish, potatoes, tartar sauce | 1 fillet + 250 g fries | Pescatarian | 980 | 42 | 100 | 46 | 8 | 1300 | Iodine, B12; fried meal |
| 66 | United Kingdom | Shepherd's pie | Meat, vegetables, mashed potato | 1 large serving | Omnivore | 740 | 34 | 68 | 36 | 8 | 1050 | Iron, potassium |
| 67 | Europe / North America | Roast chicken potatoes | Chicken, potatoes, vegetables | 180 g chicken + potatoes + veg | Omnivore | 720 | 48 | 58 | 30 | 8 | 850 | B vitamins, potassium |
| 68 | Spain | Paella | Rice, seafood/chicken, vegetables | 2 cups | Flexible | 760 | 38 | 90 | 24 | 5 | 1250 | Selenium, iodine if seafood |
| 69 | Spain | Tortilla espanola salad | Egg-potato omelet, salad | 2 wedges + salad | Vegetarian | 620 | 24 | 52 | 34 | 6 | 850 | Choline, potassium |
| 70 | Greece | Souvlaki pita salad | Grilled meat, pita, vegetables, tzatziki | 1 pita wrap + salad | Omnivore | 700 | 38 | 66 | 30 | 6 | 1150 | Calcium from yogurt, iron |
| 71 | Greece | Moussaka | Eggplant, meat, bechamel | 1 large slice | Omnivore | 780 | 34 | 48 | 48 | 8 | 1100 | Calcium, potassium |
| 72 | Germany / Austria | Schnitzel potatoes | Breaded cutlet, potatoes, salad | 1 cutlet + 1 cup potatoes | Omnivore | 850 | 42 | 70 | 42 | 6 | 1150 | Iron, B vitamins; fried coating |
| 73 | Central Europe | Goulash bread | Beef stew, bread/noodles | 1.5 cups stew + bread | Omnivore | 680 | 38 | 58 | 30 | 6 | 1100 | Iron, vitamin C from peppers |
| 74 | Eastern Europe | Pierogi plate | Stuffed dumplings, sour cream | 8 dumplings | Flexible | 720 | 22 | 92 | 28 | 6 | 1050 | Calcium if cheese filling |
| 75 | Eastern Europe | Borscht bread | Beet soup, sour cream, bread | 2 cups soup + bread | Flexible | 430 | 16 | 62 | 14 | 9 | 1000 | Folate, potassium, nitrates |
| 76 | Sweden / Nordic | Meatballs potatoes | Meatballs, potatoes, sauce, lingonberry | 8 meatballs + potatoes | Omnivore | 820 | 36 | 74 | 40 | 6 | 1250 | Iron, B12; sauce adds fat |
| 77 | Nordic | Salmon dill potatoes | Salmon, potatoes, vegetables | 170 g salmon + potatoes | Pescatarian | 720 | 42 | 50 | 38 | 7 | 750 | Omega-3, vitamin D |
| 78 | France | Savory crepe | Buckwheat/wheat crepe, ham, cheese, egg | 1 large crepe | Omnivore | 620 | 32 | 52 | 30 | 4 | 1100 | Calcium, choline |
| 79 | United States | Burger fries | Beef patty, bun, cheese, fries | 1 burger + medium fries | Omnivore | 1050 | 40 | 104 | 52 | 8 | 1500 | Iron, B12; high sodium/fat |
| 80 | North America | Grilled chicken salad | Chicken, greens, vegetables, dressing | 150 g chicken + large salad | Omnivore | 520 | 42 | 24 | 28 | 8 | 850 | Vitamin A, K, C; dressing matters |
| 81 | North America | Turkey sandwich | Bread, turkey, cheese, vegetables | 1 large sandwich | Omnivore | 600 | 36 | 62 | 22 | 6 | 1350 | B vitamins; deli meat sodium high |
| 82 | United States | Mac and cheese | Pasta, cheese sauce | 2 cups | Vegetarian | 760 | 26 | 86 | 34 | 4 | 1150 | Calcium; low fiber unless veg added |
| 83 | United States | BBQ brisket plate | Brisket, beans, coleslaw, bread | 180 g brisket + sides | Omnivore | 980 | 52 | 78 | 48 | 10 | 1600 | Iron, zinc; sauce sugar/sodium |
| 84 | North America | Chili con carne rice | Beans, beef, tomato, rice | 1.5 cups chili + 1 cup rice | Omnivore | 760 | 38 | 92 | 24 | 17 | 1200 | Fiber, iron, potassium |
| 85 | North America | Pancakes eggs bacon | Pancakes, eggs, bacon, syrup | 3 pancakes + 2 eggs + bacon | Omnivore | 900 | 32 | 106 | 38 | 4 | 1500 | Choline; sugar/sodium high |
| 86 | North America | Oatmeal fruit nuts | Oats, fruit, nuts, milk | 1.5 cups oatmeal bowl | Vegetarian | 520 | 18 | 72 | 20 | 12 | 250 | Fiber, magnesium, potassium |
| 87 | North America | Chicken Caesar wrap | Tortilla, chicken, romaine, dressing | 1 large wrap | Omnivore | 700 | 42 | 58 | 32 | 5 | 1300 | Calcium; dressing sodium/fat |
| 88 | North America | Burrito bowl | Rice, beans, meat/tofu, salsa, vegetables | 1 bowl | Flexible | 820 | 38 | 104 | 28 | 16 | 1350 | Fiber, iron, vitamin C |
| 89 | Mexico | Tacos al pastor | Corn tortillas, pork, pineapple, salsa | 3 tacos | Omnivore | 620 | 32 | 58 | 30 | 7 | 950 | Vitamin C; pork fat varies |
| 90 | Mexico | Enchiladas | Tortillas, chicken/cheese, sauce | 3 enchiladas | Flexible | 760 | 34 | 74 | 36 | 8 | 1400 | Calcium, iron; sauce sodium |
| 91 | Mexico / US Southwest | Burrito | Tortilla, rice, beans, meat, cheese | 1 large burrito | Flexible | 900 | 40 | 108 | 34 | 15 | 1550 | Fiber, calcium; large portions common |
| 92 | Venezuela / Colombia | Arepa plate | Corn arepa, beans/meat/cheese | 2 filled arepas | Flexible | 760 | 30 | 92 | 30 | 10 | 1050 | Iron, calcium if cheese |
| 93 | Brazil | Feijoada rice | Black bean pork stew, rice, greens | 1 cup stew + 1 cup rice | Omnivore | 880 | 42 | 88 | 40 | 16 | 1500 | Iron, fiber; high sodium/fat |
| 94 | Latin America | Arroz con pollo | Rice, chicken, vegetables | 2 cups | Omnivore | 720 | 38 | 86 | 24 | 6 | 1000 | B vitamins, vitamin A |
| 95 | Peru / Coastal Latin America | Ceviche tostada | Raw fish, citrus, corn/tostada | 200 g ceviche + corn | Pescatarian | 480 | 38 | 48 | 14 | 6 | 950 | Vitamin C, iodine, B12 |
| 96 | Latin America | Empanada meal | Stuffed pastry, meat/cheese/veg | 3 medium empanadas | Flexible | 780 | 28 | 76 | 40 | 5 | 1150 | Iron/calcium depending filling |
| 97 | Peru | Lomo saltado rice | Beef stir-fry, fries, rice | 1 plate | Omnivore | 920 | 42 | 104 | 38 | 7 | 1300 | Iron, vitamin C; double starch |
| 98 | Central America | Gallo pinto eggs | Rice, beans, eggs, plantain | 1.5 cups + 2 eggs | Vegetarian | 720 | 28 | 104 | 22 | 16 | 900 | Fiber, folate, potassium |
| 99 | El Salvador | Pupusas curtido | Stuffed corn cakes, cabbage slaw | 3 pupusas + curtido | Flexible | 820 | 30 | 100 | 32 | 12 | 1350 | Calcium if cheese; sodium from curtido |
| 100 | Latin America | Tamales | Masa, meat/beans, sauce | 2 large tamales | Flexible | 720 | 26 | 86 | 30 | 8 | 1150 | Folate; fat varies with lard/oil |
| 101 | Colombia | Ajiaco | Chicken-potato-corn soup, avocado, rice | 2 cups soup + sides | Omnivore | 760 | 36 | 92 | 26 | 10 | 1200 | Potassium, vitamin C |
| 102 | Mexico | Chiles rellenos rice | Stuffed peppers, rice, sauce | 2 peppers + rice | Vegetarian or omnivore | 780 | 30 | 76 | 38 | 8 | 1250 | Vitamin C, calcium if cheese |
| 103 | West Africa | Jollof rice chicken | Tomato rice, chicken, vegetables | 2 cups rice + 150 g chicken | Omnivore | 820 | 38 | 96 | 28 | 6 | 1100 | Vitamin A, iron |
| 104 | Ethiopia / Eritrea | Injera lentil platter | Teff injera, lentils, vegetables | 2 injera + stews | Vegan | 760 | 28 | 128 | 14 | 20 | 1150 | Iron, calcium, fiber |
| 105 | East Africa | Ugali sukuma beef | Maize meal, greens, beef stew | 2 cups ugali + stew | Omnivore | 780 | 38 | 102 | 22 | 10 | 850 | Iron, vitamin K, vitamin C |
| 106 | Ghana | Waakye fish | Rice and beans, fish, egg, sauce | 2 cups + fish | Pescatarian | 850 | 42 | 104 | 28 | 14 | 1250 | Fiber, iron, iodine |
| 107 | West Africa | Egusi soup fufu | Melon seed stew, leafy greens, fufu | 1.5 cups soup + fufu | Omnivore | 920 | 34 | 86 | 48 | 12 | 1150 | Magnesium, iron; high fat from seeds/oil |
| 108 | South Africa | Bunny chow | Curry served in bread loaf | 1 half loaf filled | Flexible | 950 | 34 | 126 | 34 | 14 | 1500 | Fiber if bean curry; high carb |
| 109 | South Africa | Bobotie rice | Spiced minced meat bake, rice | 1 serving + 1 cup rice | Omnivore | 820 | 36 | 78 | 38 | 5 | 1050 | Iron, B12; sweet chutney may add sugar |
| 110 | Egypt | Koshari | Rice, lentils, pasta, chickpeas, tomato sauce | 2 cups | Vegan | 780 | 24 | 136 | 16 | 18 | 1200 | Folate, iron, fiber |
| 111 | West Africa | Maafe rice | Peanut stew, meat/veg, rice | 1.5 cups stew + 1 cup rice | Flexible | 860 | 34 | 86 | 40 | 10 | 1050 | Magnesium, niacin; peanut allergy warning |
| 112 | Senegal / West Africa | Thieboudienne | Fish, rice, vegetables, tomato sauce | 2 cups rice + fish | Pescatarian | 820 | 40 | 96 | 28 | 7 | 1300 | Iodine, selenium, vitamin A |
| 113 | Southern Africa | Sadza relish | Maize porridge, greens, meat/beans | 2 cups sadza + relish | Flexible | 720 | 28 | 108 | 18 | 11 | 850 | Vitamin K, iron; protein varies |
| 114 | West Africa | Akara pap | Bean fritters, corn porridge | 5 fritters + 1 bowl pap | Vegetarian | 740 | 24 | 104 | 26 | 12 | 900 | Folate, fiber; fried meal |

## Required Fields For Future Entries

Any new entry added by the app should include:

- common meal name
- user-provided location
- regional location category
- staple food items
- average user-confirmed quantity
- diet configuration
- calories
- protein
- carbohydrates
- fat
- fiber
- sugar where available
- sodium where available
- key micronutrients where reliable
- source used for nutrition lookup
- confidence score
- review status

New entries must be marked as `pending_review` until approved.

## Ingredient Reference List

This separate ingredient list is for autocomplete, AI food matching, and manual correction. It is not a nutrition table by itself. Nutrition values still need lookup from USDA FoodData Central or another trusted nutrition database before being treated as verified.

Reference basis:

- USDA MyPlate Vegetable Group: https://www.myplate.gov/eathealthy/vegetables
- USDA MyPlate Fruit Group: https://www.myplate.gov/eathealthy/fruits
- USDA MyPlate Protein Foods Group: https://www.myplate.gov/eathealthy/protein-foods/protein-foods-nutrients-health
- USDA MyPlate Grains Group: https://www.myplate.gov/web/web/eat-healthy/grains
- USDA FoodData Central: https://fdc.nal.usda.gov/

| Ingredient Category | Subcategory | Ingredient Names |
|---|---|---|
| Vegetables | Dark green vegetables | Amaranth leaves, arugula, basil, beet greens, bitter melon leaves, bok choy, broccoli, broccoli rabe, broccolini, chard, cilantro, collard greens, cress, dandelion greens, dark green leafy lettuce, endive, escarole, kale, lambsquarters, mesclun, mixed greens, mustard greens, nettles, romaine lettuce, spinach, Swiss chard, taro leaves, turnip greens, watercress |
| Vegetables | Red and orange vegetables | Acorn squash, butternut squash, calabaza, carrot, hubbard squash, kabocha squash, pimento, pumpkin, red bell pepper, orange bell pepper, red chili pepper, sweet red pepper, sweet potato, tomato, winter squash |
| Vegetables | Starchy vegetables and roots | Breadfruit, burdock root, cassava, corn, fufu, green banana, green lima beans, green peas, hominy, jicama, lotus root, parsnip, plantain, potato, salsify, tapioca, taro root, water chestnut, yam, yuca |
| Vegetables | Beans, peas, and lentils | Bayo beans, black beans, black-eyed peas, brown beans, chickpeas, cow peas, edamame, fava beans, kidney beans, lentils, lima beans, mung beans, navy beans, pigeon peas, pink beans, pinto beans, soybeans, split peas, white beans |
| Vegetables | Other vegetables | Asparagus, avocado, bamboo shoots, bean sprouts, cabbage, napa cabbage, red cabbage, savoy cabbage, cactus pads, cauliflower, celery, cucumber, eggplant, green beans, wax beans, green bell pepper, iceberg lettuce, mushroom, okra, onion, scallion, leek, radish, summer squash, zucchini |
| Vegetables | Herbs and aromatics | Garlic, ginger, mint, parsley, coriander leaves, curry leaves, dill, fennel bulb, lemongrass, oregano, rosemary, sage, thyme |
| Fruits | Common fruits | Apple, applesauce, apricot, banana, cherry, date, fig, grape, guava, kiwi, mango, nectarine, orange, papaya, peach, pear, persimmon, pineapple, plum, pomegranate |
| Fruits | Berries | Blackberry, blueberry, cranberry, raspberry, strawberry |
| Fruits | Citrus fruits | Grapefruit, lemon, lime, mandarin orange, orange, pomelo, tangerine |
| Fruits | Melons | Cantaloupe, casaba melon, honeydew melon, muskmelon, watermelon |
| Fruits | Tropical fruits | Breadfruit, dragon fruit, jackfruit, lychee, passion fruit, plantain, sapote, star fruit |
| Fruits | Dried fruits | Dried apricot, dried fig, dried mango, dried peach, prune, raisin |
| Non-vegetarian proteins | Poultry | Chicken, chicken breast, chicken thigh, chicken leg, chicken wing, turkey, duck, goose, quail, pheasant, Cornish hen, ostrich |
| Non-vegetarian proteins | Red meat and game | Beef, ground beef, steak, goat, lamb, mutton, pork, ham, bison, deer, elk, rabbit, venison |
| Non-vegetarian proteins | Organ and processed meats | Liver, kidney, heart, sausage, bacon, salami, deli chicken, deli ham, deli turkey |
| Non-vegetarian proteins | Eggs | Chicken egg, duck egg, egg white, egg yolk |
| Seafood | Finfish | Anchovy, black sea bass, catfish, cod, flounder, freshwater trout, haddock, hake, halibut, herring, light tuna, mackerel, mullet, perch, pollock, salmon, sardine, sea bass, snapper, sole, tilapia, whiting |
| Seafood | Shellfish | Clam, crab, crayfish, lobster, mussel, octopus, oyster, scallop, shrimp, squid |
| Plant proteins | Soy and meat alternatives | Tofu, tempeh, textured vegetable protein, seitan, soy chunks, soy milk, soy yogurt |
| Plant proteins | Nuts and seeds | Almond, cashew, peanut, pistachio, walnut, chia seeds, flax seeds, pumpkin seeds, sesame seeds, sunflower seeds, tahini |
| Grains and staples | Whole and refined grains | Barley, buckwheat, bulgur, cornmeal, couscous, millet, oats, oatmeal, pasta, quinoa, rice, brown rice, white rice, rye, sorghum, teff, wheat, wheat flour, wild rice |
| Grains and staples | Breads and flatbreads | Bagel, biscuit, bread, chapati, cornbread, cracker, dosa, English muffin, idli, injera, naan, pancake, pita, roti, tortilla |
| Dairy and alternatives | Dairy ingredients | Milk, yogurt, curd, cheese, paneer, cottage cheese, mozzarella, cheddar, halloumi, cream, butter, ghee |
| Oils and fats | Cooking fats | Olive oil, canola oil, sunflower oil, soybean oil, peanut oil, coconut oil, sesame oil, mustard oil, palm oil, butter, ghee, lard, beef tallow |
| Sweeteners and condiments | Common additions | Sugar, honey, maple syrup, jaggery, molasses, soy sauce, fish sauce, vinegar, ketchup, mustard, mayonnaise, hot sauce, salsa |

## Ingredient Nutrition Reference Baseline

Use this section as a first-pass nutrition lookup for manually entered ingredients and quantity/unit changes. Values are approximate per 100 g edible portion unless noted. Prefer USDA FoodData Central Foundation Foods where available, then SR Legacy/FNDDS representative entries. Keep these values labeled as estimates until a specific USDA FDC food ID or another trusted database record is attached.

Reference basis:

- USDA FoodData Central downloadable datasets, latest release listed as April 2026 for Foundation Foods and April 2018 for SR Legacy: https://fdc.nal.usda.gov/download-datasets
- USDA FoodData Central API guide for searchable food and food-detail endpoints: https://fdc.nal.usda.gov/api-guide
- USDA FoodData Central data overview and public-domain data notice: https://fdc.nal.usda.gov/

| Ingredient | Category | Common State | Kcal | Protein g | Carbs g | Fat g | Fiber g | Sugar g | Sodium mg | Data Confidence | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Amaranth leaves | Vegetable | Raw | 23 | 2.5 | 4.0 | 0.3 | 2.1 | 0.4 | 20 | Medium | Leafy greens vary by variety |
| Arugula | Vegetable | Raw | 25 | 2.6 | 3.7 | 0.7 | 1.6 | 2.1 | 27 | High | Dark green leafy vegetable |
| Basil | Herb | Fresh | 23 | 3.2 | 2.7 | 0.6 | 1.6 | 0.3 | 4 | Medium | Usually used in small amounts |
| Beet greens | Vegetable | Raw | 22 | 2.2 | 4.3 | 0.1 | 3.7 | 0.5 | 226 | Medium | Sodium can be naturally higher |
| Bitter melon leaves | Vegetable | Raw | 34 | 3.6 | 6.7 | 0.3 | 3.5 | 1.0 | 13 | Low | Regional leaf data varies |
| Bok choy | Vegetable | Raw | 13 | 1.5 | 2.2 | 0.2 | 1.0 | 1.2 | 65 | High | Also called pak choi |
| Broccoli | Vegetable | Raw | 34 | 2.8 | 6.6 | 0.4 | 2.6 | 1.7 | 33 | High | Cooking changes water weight |
| Broccoli rabe | Vegetable | Raw | 22 | 3.2 | 2.9 | 0.5 | 2.7 | 0.4 | 33 | Medium | Also called rapini |
| Broccolini | Vegetable | Raw | 35 | 3.5 | 6.0 | 0.4 | 3.0 | 1.5 | 35 | Low | Use broccoli if no exact match |
| Chard | Vegetable | Raw | 19 | 1.8 | 3.7 | 0.2 | 1.6 | 1.1 | 213 | High | Includes Swiss chard style data |
| Cilantro | Herb | Fresh | 23 | 2.1 | 3.7 | 0.5 | 2.8 | 0.9 | 46 | Medium | Usually used in small amounts |
| Collard greens | Vegetable | Raw | 32 | 3.0 | 5.4 | 0.6 | 4.0 | 0.5 | 17 | High | Cooked values differ |
| Cress | Vegetable | Raw | 32 | 2.6 | 5.5 | 0.7 | 1.1 | 4.4 | 14 | Medium | Use watercress if exact type unknown |
| Dandelion greens | Vegetable | Raw | 45 | 2.7 | 9.2 | 0.7 | 3.5 | 0.7 | 76 | Medium | Bitter leafy green |
| Dark green leafy lettuce | Vegetable | Raw | 15 | 1.4 | 2.9 | 0.2 | 1.3 | 0.8 | 28 | Medium | Representative lettuce value |
| Endive | Vegetable | Raw | 17 | 1.3 | 3.4 | 0.2 | 3.1 | 0.3 | 22 | High | Leafy vegetable |
| Escarole | Vegetable | Raw | 17 | 1.3 | 3.4 | 0.2 | 3.1 | 0.3 | 22 | Medium | Similar to endive |
| Kale | Vegetable | Raw | 49 | 4.3 | 8.8 | 0.9 | 3.6 | 2.3 | 38 | High | Nutrients vary by variety |
| Lambsquarters | Vegetable | Raw | 43 | 4.2 | 7.3 | 0.8 | 4.0 | 0.0 | 43 | Low | Regional wild green |
| Mesclun | Vegetable | Raw | 20 | 1.6 | 3.5 | 0.3 | 1.8 | 1.2 | 30 | Low | Mixed greens average |
| Mixed greens | Vegetable | Raw | 20 | 1.6 | 3.5 | 0.3 | 1.8 | 1.2 | 30 | Low | Blend varies |
| Mustard greens | Vegetable | Raw | 27 | 2.9 | 4.7 | 0.4 | 3.2 | 1.3 | 20 | High | Raw baseline |
| Nettles | Vegetable | Raw | 42 | 2.7 | 7.5 | 0.1 | 6.9 | 0.2 | 4 | Low | Use with caution; preparation matters |
| Romaine lettuce | Vegetable | Raw | 17 | 1.2 | 3.3 | 0.3 | 2.1 | 1.2 | 8 | High | Common salad green |
| Spinach | Vegetable | Raw | 23 | 2.9 | 3.6 | 0.4 | 2.2 | 0.4 | 79 | High | Cooked weight concentrates nutrients |
| Swiss chard | Vegetable | Raw | 19 | 1.8 | 3.7 | 0.2 | 1.6 | 1.1 | 213 | High | Same family as chard |
| Taro leaves | Vegetable | Cooked | 24 | 2.7 | 4.0 | 0.4 | 2.0 | 0.7 | 3 | Medium | Must be cooked before eating |
| Turnip greens | Vegetable | Raw | 32 | 1.5 | 7.1 | 0.3 | 3.2 | 0.8 | 40 | High | Leafy green |
| Watercress | Vegetable | Raw | 11 | 2.3 | 1.3 | 0.1 | 0.5 | 0.2 | 41 | High | Very low calorie green |
| Acorn squash | Vegetable | Baked | 40 | 0.8 | 10.4 | 0.1 | 1.5 | 0.0 | 1 | Medium | Winter squash |
| Butternut squash | Vegetable | Baked | 40 | 0.9 | 10.5 | 0.1 | 3.2 | 2.2 | 4 | High | Winter squash |
| Calabaza | Vegetable | Cooked | 35 | 1.0 | 8.6 | 0.1 | 1.5 | 2.5 | 1 | Low | Use winter squash if exact match missing |
| Carrot | Vegetable | Raw | 41 | 0.9 | 9.6 | 0.2 | 2.8 | 4.7 | 69 | High | Common orange vegetable |
| Hubbard squash | Vegetable | Baked | 50 | 2.5 | 10.8 | 0.6 | 4.9 | 3.0 | 4 | Medium | Winter squash |
| Kabocha squash | Vegetable | Cooked | 49 | 1.8 | 12.0 | 0.1 | 2.7 | 3.0 | 1 | Low | Similar to winter squash |
| Pimento | Vegetable | Raw | 26 | 1.0 | 6.0 | 0.3 | 2.1 | 4.2 | 1 | Medium | Sweet pepper type |
| Pumpkin | Vegetable | Cooked | 20 | 0.7 | 4.9 | 0.1 | 1.1 | 2.1 | 1 | High | Unsweetened pumpkin |
| Red bell pepper | Vegetable | Raw | 31 | 1.0 | 6.0 | 0.3 | 2.1 | 4.2 | 4 | High | High vitamin C |
| Orange bell pepper | Vegetable | Raw | 31 | 1.0 | 6.0 | 0.3 | 2.1 | 4.2 | 4 | Medium | Use bell pepper average |
| Red chili pepper | Vegetable | Raw | 40 | 1.9 | 8.8 | 0.4 | 1.5 | 5.3 | 9 | Medium | Heat level varies |
| Sweet red pepper | Vegetable | Raw | 31 | 1.0 | 6.0 | 0.3 | 2.1 | 4.2 | 4 | High | Same baseline as red bell pepper |
| Sweet potato | Vegetable | Baked | 90 | 2.0 | 20.7 | 0.2 | 3.3 | 6.5 | 36 | High | Orange flesh baseline |
| Tomato | Vegetable | Raw | 18 | 0.9 | 3.9 | 0.2 | 1.2 | 2.6 | 5 | High | Fruit botanically, vegetable use |
| Winter squash | Vegetable | Baked | 40 | 0.9 | 10.5 | 0.1 | 2.0 | 2.2 | 4 | Medium | General winter squash average |
| Breadfruit | Fruit/Starch | Raw | 103 | 1.1 | 27.1 | 0.2 | 4.9 | 11.0 | 2 | Medium | Also used as staple |
| Burdock root | Vegetable | Raw | 72 | 1.5 | 17.3 | 0.2 | 3.3 | 2.9 | 5 | Medium | Root vegetable |
| Cassava | Starch | Raw | 160 | 1.4 | 38.1 | 0.3 | 1.8 | 1.7 | 14 | High | Must be prepared correctly |
| Corn | Vegetable/Starch | Cooked kernels | 96 | 3.4 | 21.0 | 1.5 | 2.4 | 4.5 | 1 | High | Sweet corn baseline |
| Fufu | Staple | Prepared | 110 | 1.0 | 26.0 | 0.2 | 1.5 | 0.5 | 5 | Low | Recipe and source starch vary |
| Green banana | Fruit/Starch | Raw | 89 | 1.1 | 22.8 | 0.3 | 2.6 | 12.2 | 1 | Medium | Less ripe has more resistant starch |
| Green lima beans | Vegetable/Legume | Cooked | 115 | 7.8 | 20.9 | 0.4 | 7.0 | 2.9 | 2 | High | Cooked without salt |
| Green peas | Vegetable/Legume | Cooked | 84 | 5.4 | 15.6 | 0.2 | 5.5 | 5.9 | 3 | High | Cooked without salt |
| Hominy | Grain/Starch | Canned drained | 72 | 1.5 | 14.3 | 0.9 | 2.5 | 1.0 | 345 | Medium | Sodium depends on canned product |
| Jicama | Vegetable | Raw | 38 | 0.7 | 8.8 | 0.1 | 4.9 | 1.8 | 4 | Medium | Root vegetable |
| Lotus root | Vegetable | Raw | 74 | 2.6 | 17.2 | 0.1 | 4.9 | 0.5 | 40 | Medium | Root vegetable |
| Parsnip | Vegetable | Raw | 75 | 1.2 | 18.0 | 0.3 | 4.9 | 4.8 | 10 | High | Root vegetable |
| Plantain | Fruit/Starch | Raw | 122 | 1.3 | 31.9 | 0.4 | 2.3 | 15.0 | 4 | High | Cooking method changes calories |
| Potato | Vegetable | Baked flesh and skin | 93 | 2.5 | 21.2 | 0.1 | 2.2 | 1.2 | 10 | High | Plain potato, no oil |
| Salsify | Vegetable | Raw | 82 | 3.3 | 18.6 | 0.2 | 3.3 | 3.0 | 20 | Medium | Root vegetable |
| Tapioca | Starch | Dry pearls | 358 | 0.2 | 88.7 | 0.0 | 0.9 | 3.4 | 1 | Medium | Dry value; cooked much lower |
| Taro root | Vegetable/Starch | Cooked | 142 | 0.5 | 34.6 | 0.1 | 5.1 | 0.5 | 0 | Medium | Cooked baseline |
| Water chestnut | Vegetable | Raw | 97 | 1.4 | 23.9 | 0.1 | 3.0 | 4.8 | 14 | Medium | Asian water chestnut |
| Yam | Vegetable/Starch | Cooked | 116 | 1.5 | 27.5 | 0.1 | 3.9 | 0.5 | 8 | High | Not sweet potato |
| Yuca | Starch | Raw | 160 | 1.4 | 38.1 | 0.3 | 1.8 | 1.7 | 14 | High | Same baseline as cassava |
| Black beans | Legume | Cooked | 132 | 8.9 | 23.7 | 0.5 | 8.7 | 0.3 | 1 | High | Cooked without salt |
| Black-eyed peas | Legume | Cooked | 116 | 7.7 | 20.8 | 0.5 | 6.5 | 3.3 | 4 | High | Cooked without salt |
| Chickpeas | Legume | Cooked | 164 | 8.9 | 27.4 | 2.6 | 7.6 | 4.8 | 7 | High | Also called garbanzo beans |
| Cow peas | Legume | Cooked | 116 | 7.7 | 20.8 | 0.5 | 6.5 | 3.3 | 4 | Medium | Similar to black-eyed peas |
| Edamame | Legume | Cooked | 121 | 11.9 | 8.9 | 5.2 | 5.2 | 2.2 | 6 | High | Immature soybeans |
| Fava beans | Legume | Cooked | 110 | 7.6 | 19.7 | 0.4 | 5.4 | 1.8 | 5 | High | Cooked without salt |
| Kidney beans | Legume | Cooked | 127 | 8.7 | 22.8 | 0.5 | 6.4 | 0.3 | 1 | High | Cooked without salt |
| Lentils | Legume | Cooked | 116 | 9.0 | 20.1 | 0.4 | 7.9 | 1.8 | 2 | High | Cooked without salt |
| Lima beans | Legume | Cooked | 115 | 7.8 | 20.9 | 0.4 | 7.0 | 2.9 | 2 | High | Mature cooked beans |
| Mung beans | Legume | Cooked | 105 | 7.0 | 19.2 | 0.4 | 7.6 | 2.0 | 2 | High | Cooked without salt |
| Navy beans | Legume | Cooked | 140 | 8.2 | 26.1 | 0.6 | 10.5 | 0.4 | 1 | High | Cooked without salt |
| Pigeon peas | Legume | Cooked | 121 | 6.8 | 23.3 | 0.4 | 6.7 | 2.9 | 5 | Medium | Cooked without salt |
| Pinto beans | Legume | Cooked | 143 | 9.0 | 26.2 | 0.7 | 9.0 | 0.3 | 1 | High | Cooked without salt |
| Soybeans | Legume | Cooked | 172 | 18.2 | 8.4 | 9.0 | 6.0 | 3.0 | 1 | High | Mature cooked soybeans |
| Split peas | Legume | Cooked | 118 | 8.3 | 21.1 | 0.4 | 8.3 | 2.9 | 2 | High | Cooked without salt |
| White beans | Legume | Cooked | 139 | 9.7 | 25.1 | 0.4 | 6.3 | 0.3 | 5 | High | Cooked without salt |
| Asparagus | Vegetable | Raw | 20 | 2.2 | 3.9 | 0.1 | 2.1 | 1.9 | 2 | High | Raw baseline |
| Avocado | Fruit/Fat | Raw | 160 | 2.0 | 8.5 | 14.7 | 6.7 | 0.7 | 7 | High | High fat fruit |
| Bamboo shoots | Vegetable | Raw | 27 | 2.6 | 5.2 | 0.3 | 2.2 | 3.0 | 4 | Medium | Canned sodium can be higher |
| Bean sprouts | Vegetable | Raw | 30 | 3.0 | 5.9 | 0.2 | 1.8 | 4.1 | 6 | High | Mung bean sprouts baseline |
| Cabbage | Vegetable | Raw | 25 | 1.3 | 5.8 | 0.1 | 2.5 | 3.2 | 18 | High | Green cabbage |
| Napa cabbage | Vegetable | Raw | 16 | 1.2 | 3.2 | 0.2 | 1.2 | 1.4 | 9 | Medium | Chinese cabbage |
| Red cabbage | Vegetable | Raw | 31 | 1.4 | 7.4 | 0.2 | 2.1 | 3.8 | 27 | High | Raw baseline |
| Savoy cabbage | Vegetable | Raw | 27 | 2.0 | 6.1 | 0.1 | 3.1 | 2.3 | 28 | Medium | Raw baseline |
| Cactus pads | Vegetable | Raw | 16 | 1.3 | 3.3 | 0.1 | 2.2 | 1.2 | 21 | Medium | Nopales |
| Cauliflower | Vegetable | Raw | 25 | 1.9 | 5.0 | 0.3 | 2.0 | 1.9 | 30 | High | Raw baseline |
| Celery | Vegetable | Raw | 14 | 0.7 | 3.0 | 0.2 | 1.6 | 1.3 | 80 | High | Naturally sodium-containing |
| Cucumber | Vegetable | Raw with peel | 15 | 0.7 | 3.6 | 0.1 | 0.5 | 1.7 | 2 | High | High water content |
| Eggplant | Vegetable | Raw | 25 | 1.0 | 5.9 | 0.2 | 3.0 | 3.5 | 2 | High | Raw baseline |
| Green beans | Vegetable | Cooked | 35 | 1.9 | 7.9 | 0.3 | 3.2 | 1.4 | 1 | High | Cooked without salt |
| Wax beans | Vegetable | Cooked | 35 | 1.9 | 7.9 | 0.3 | 3.2 | 1.4 | 1 | Medium | Similar to green beans |
| Green bell pepper | Vegetable | Raw | 20 | 0.9 | 4.6 | 0.2 | 1.7 | 2.4 | 3 | High | Raw baseline |
| Iceberg lettuce | Vegetable | Raw | 14 | 0.9 | 3.0 | 0.1 | 1.2 | 2.0 | 10 | High | Salad lettuce |
| Mushroom | Vegetable | Raw white | 22 | 3.1 | 3.3 | 0.3 | 1.0 | 2.0 | 5 | High | Type varies |
| Okra | Vegetable | Raw | 33 | 1.9 | 7.5 | 0.2 | 3.2 | 1.5 | 7 | High | Raw baseline |
| Onion | Vegetable | Raw | 40 | 1.1 | 9.3 | 0.1 | 1.7 | 4.2 | 4 | High | Common onion |
| Scallion | Vegetable | Raw | 32 | 1.8 | 7.3 | 0.2 | 2.6 | 2.3 | 16 | High | Green onion |
| Leek | Vegetable | Raw | 61 | 1.5 | 14.2 | 0.3 | 1.8 | 3.9 | 20 | High | Raw baseline |
| Radish | Vegetable | Raw | 16 | 0.7 | 3.4 | 0.1 | 1.6 | 1.9 | 39 | High | Raw baseline |
| Summer squash | Vegetable | Raw | 16 | 1.2 | 3.4 | 0.2 | 1.1 | 2.2 | 2 | High | Includes yellow squash |
| Zucchini | Vegetable | Raw | 17 | 1.2 | 3.1 | 0.3 | 1.0 | 2.5 | 8 | High | Raw baseline |
| Garlic | Aromatic | Raw | 149 | 6.4 | 33.1 | 0.5 | 2.1 | 1.0 | 17 | High | Usually used in small amounts |
| Ginger | Aromatic | Raw | 80 | 1.8 | 17.8 | 0.8 | 2.0 | 1.7 | 13 | High | Fresh root |
| Mint | Herb | Fresh | 44 | 3.3 | 8.4 | 0.7 | 6.8 | 0.0 | 31 | Medium | Usually used in small amounts |
| Parsley | Herb | Fresh | 36 | 3.0 | 6.3 | 0.8 | 3.3 | 0.9 | 56 | High | Usually used in small amounts |
| Coriander leaves | Herb | Fresh | 23 | 2.1 | 3.7 | 0.5 | 2.8 | 0.9 | 46 | Medium | Same as cilantro |
| Curry leaves | Herb | Fresh | 108 | 6.1 | 18.7 | 1.0 | 6.4 | 0.0 | 20 | Low | Regional data varies |
| Dill | Herb | Fresh | 43 | 3.5 | 7.0 | 1.1 | 2.1 | 0.0 | 61 | Medium | Usually used in small amounts |
| Fennel bulb | Vegetable | Raw | 31 | 1.2 | 7.3 | 0.2 | 3.1 | 3.9 | 52 | High | Raw bulb |
| Lemongrass | Herb | Fresh | 99 | 1.8 | 25.3 | 0.5 | 0.0 | 0.0 | 6 | Medium | Usually infused, not fully eaten |
| Oregano | Herb | Fresh | 265 | 9.0 | 68.9 | 4.3 | 42.5 | 4.1 | 25 | Medium | Dry values are much higher per 100g |
| Rosemary | Herb | Fresh | 131 | 3.3 | 20.7 | 5.9 | 14.1 | 0.0 | 26 | Medium | Usually used in small amounts |
| Sage | Herb | Fresh | 315 | 10.6 | 60.7 | 12.8 | 40.3 | 1.7 | 11 | Medium | Dry-like reference; small use |
| Thyme | Herb | Fresh | 101 | 5.6 | 24.5 | 1.7 | 14.0 | 1.7 | 9 | Medium | Usually used in small amounts |
| Apple | Fruit | Raw with skin | 52 | 0.3 | 13.8 | 0.2 | 2.4 | 10.4 | 1 | High | Common raw apple |
| Applesauce | Fruit | Unsweetened | 42 | 0.2 | 11.3 | 0.1 | 1.1 | 9.4 | 2 | Medium | Sweetened versions higher sugar |
| Apricot | Fruit | Raw | 48 | 1.4 | 11.1 | 0.4 | 2.0 | 9.2 | 1 | High | Raw baseline |
| Banana | Fruit | Raw | 89 | 1.1 | 22.8 | 0.3 | 2.6 | 12.2 | 1 | High | Ripeness changes sugar |
| Cherry | Fruit | Raw sweet | 63 | 1.1 | 16.0 | 0.2 | 2.1 | 12.8 | 0 | High | Sweet cherries |
| Date | Fruit | Medjool | 277 | 1.8 | 75.0 | 0.2 | 6.7 | 66.5 | 1 | High | Dried fruit |
| Fig | Fruit | Raw | 74 | 0.8 | 19.2 | 0.3 | 2.9 | 16.3 | 1 | High | Raw fig |
| Grape | Fruit | Raw | 69 | 0.7 | 18.1 | 0.2 | 0.9 | 15.5 | 2 | High | Raw baseline |
| Guava | Fruit | Raw | 68 | 2.6 | 14.3 | 1.0 | 5.4 | 8.9 | 2 | High | High vitamin C |
| Kiwi | Fruit | Raw | 61 | 1.1 | 14.7 | 0.5 | 3.0 | 9.0 | 3 | High | Raw baseline |
| Mango | Fruit | Raw | 60 | 0.8 | 15.0 | 0.4 | 1.6 | 13.7 | 1 | High | Raw baseline |
| Nectarine | Fruit | Raw | 44 | 1.1 | 10.6 | 0.3 | 1.7 | 7.9 | 0 | High | Raw baseline |
| Orange | Fruit | Raw | 47 | 0.9 | 11.8 | 0.1 | 2.4 | 9.4 | 0 | High | Citrus fruit |
| Papaya | Fruit | Raw | 43 | 0.5 | 10.8 | 0.3 | 1.7 | 7.8 | 8 | High | Raw baseline |
| Peach | Fruit | Raw | 39 | 0.9 | 9.5 | 0.3 | 1.5 | 8.4 | 0 | High | Raw baseline |
| Pear | Fruit | Raw | 57 | 0.4 | 15.2 | 0.1 | 3.1 | 9.8 | 1 | High | Raw with skin |
| Persimmon | Fruit | Raw | 70 | 0.6 | 18.6 | 0.2 | 3.6 | 12.5 | 1 | Medium | Variety changes sugar |
| Pineapple | Fruit | Raw | 50 | 0.5 | 13.1 | 0.1 | 1.4 | 9.9 | 1 | High | Raw baseline |
| Plum | Fruit | Raw | 46 | 0.7 | 11.4 | 0.3 | 1.4 | 9.9 | 0 | High | Raw baseline |
| Pomegranate | Fruit | Raw arils | 83 | 1.7 | 18.7 | 1.2 | 4.0 | 13.7 | 3 | High | Arils only |
| Blackberry | Fruit | Raw | 43 | 1.4 | 10.2 | 0.5 | 5.3 | 4.9 | 1 | High | Berry |
| Blueberry | Fruit | Raw | 57 | 0.7 | 14.5 | 0.3 | 2.4 | 10.0 | 1 | High | Berry |
| Cranberry | Fruit | Raw | 46 | 0.4 | 12.2 | 0.1 | 4.6 | 4.0 | 2 | High | Unsweetened raw |
| Raspberry | Fruit | Raw | 52 | 1.2 | 11.9 | 0.7 | 6.5 | 4.4 | 1 | High | Berry |
| Strawberry | Fruit | Raw | 32 | 0.7 | 7.7 | 0.3 | 2.0 | 4.9 | 1 | High | Berry |
| Grapefruit | Fruit | Raw | 42 | 0.8 | 10.7 | 0.1 | 1.6 | 6.9 | 0 | High | Citrus |
| Lemon | Fruit | Raw | 29 | 1.1 | 9.3 | 0.3 | 2.8 | 2.5 | 2 | High | Often used as juice |
| Lime | Fruit | Raw | 30 | 0.7 | 10.5 | 0.2 | 2.8 | 1.7 | 2 | High | Often used as juice |
| Mandarin orange | Fruit | Raw | 53 | 0.8 | 13.3 | 0.3 | 1.8 | 10.6 | 2 | High | Citrus |
| Pomelo | Fruit | Raw | 38 | 0.8 | 9.6 | 0.0 | 1.0 | 8.6 | 1 | Medium | Citrus |
| Tangerine | Fruit | Raw | 53 | 0.8 | 13.3 | 0.3 | 1.8 | 10.6 | 2 | High | Similar to mandarin |
| Cantaloupe | Fruit | Raw | 34 | 0.8 | 8.2 | 0.2 | 0.9 | 7.9 | 16 | High | Melon |
| Casaba melon | Fruit | Raw | 28 | 1.1 | 6.6 | 0.1 | 0.9 | 5.7 | 9 | Medium | Melon |
| Honeydew melon | Fruit | Raw | 36 | 0.5 | 9.1 | 0.1 | 0.8 | 8.1 | 18 | High | Melon |
| Muskmelon | Fruit | Raw | 34 | 0.8 | 8.2 | 0.2 | 0.9 | 7.9 | 16 | Medium | Similar to cantaloupe |
| Watermelon | Fruit | Raw | 30 | 0.6 | 7.6 | 0.2 | 0.4 | 6.2 | 1 | High | Melon |
| Dragon fruit | Fruit | Raw | 57 | 0.4 | 15.2 | 0.1 | 3.1 | 9.8 | 1 | Low | Use exact FDC match later |
| Jackfruit | Fruit | Raw | 95 | 1.7 | 23.2 | 0.6 | 1.5 | 19.1 | 2 | High | Ripe raw |
| Lychee | Fruit | Raw | 66 | 0.8 | 16.5 | 0.4 | 1.3 | 15.2 | 1 | High | Raw baseline |
| Passion fruit | Fruit | Raw | 97 | 2.2 | 23.4 | 0.7 | 10.4 | 11.2 | 28 | High | Raw pulp |
| Sapote | Fruit | Raw | 124 | 1.5 | 32.1 | 0.5 | 5.4 | 20.0 | 7 | Low | Variety varies |
| Star fruit | Fruit | Raw | 31 | 1.0 | 6.7 | 0.3 | 2.8 | 4.0 | 2 | High | Also called carambola |
| Dried apricot | Fruit | Dried | 241 | 3.4 | 62.6 | 0.5 | 7.3 | 53.4 | 10 | High | Dried fruit |
| Dried fig | Fruit | Dried | 249 | 3.3 | 63.9 | 0.9 | 9.8 | 47.9 | 10 | High | Dried fruit |
| Dried mango | Fruit | Dried | 319 | 2.5 | 78.6 | 1.2 | 2.4 | 66.3 | 162 | Medium | Often sweetened |
| Dried peach | Fruit | Dried | 239 | 3.6 | 61.3 | 0.8 | 8.2 | 41.7 | 10 | Medium | Dried fruit |
| Prune | Fruit | Dried | 240 | 2.2 | 63.9 | 0.4 | 7.1 | 38.1 | 2 | High | Dried plum |
| Raisin | Fruit | Dried | 299 | 3.1 | 79.2 | 0.5 | 3.7 | 59.2 | 11 | High | Dried grape |
| Chicken | Poultry | Cooked roasted meat | 190 | 28.9 | 0.0 | 7.4 | 0.0 | 0.0 | 86 | High | Mixed meat baseline |
| Chicken breast | Poultry | Cooked skinless | 165 | 31.0 | 0.0 | 3.6 | 0.0 | 0.0 | 74 | High | Lean poultry |
| Chicken thigh | Poultry | Cooked meat | 209 | 26.0 | 0.0 | 10.9 | 0.0 | 0.0 | 88 | High | Skin changes fat |
| Chicken leg | Poultry | Cooked meat | 184 | 27.3 | 0.0 | 7.6 | 0.0 | 0.0 | 92 | High | Roasted meat baseline |
| Chicken wing | Poultry | Cooked meat and skin | 290 | 26.9 | 0.0 | 19.5 | 0.0 | 0.0 | 82 | High | Skin increases fat |
| Turkey | Poultry | Cooked meat | 189 | 29.1 | 0.0 | 7.4 | 0.0 | 0.0 | 103 | High | Mixed meat baseline |
| Duck | Poultry | Cooked meat and skin | 337 | 19.0 | 0.0 | 28.4 | 0.0 | 0.0 | 59 | High | Skin greatly raises fat |
| Goose | Poultry | Cooked meat and skin | 305 | 25.2 | 0.0 | 21.9 | 0.0 | 0.0 | 73 | Medium | Roasted baseline |
| Quail | Poultry | Cooked | 227 | 25.1 | 0.0 | 14.1 | 0.0 | 0.0 | 52 | Medium | Game bird |
| Pheasant | Poultry | Cooked | 239 | 32.4 | 0.0 | 12.1 | 0.0 | 0.0 | 55 | Medium | Game bird |
| Cornish hen | Poultry | Cooked | 200 | 27.0 | 0.0 | 9.0 | 0.0 | 0.0 | 75 | Medium | Similar to chicken |
| Ostrich | Poultry/Game | Cooked | 145 | 28.0 | 0.0 | 3.0 | 0.0 | 0.0 | 70 | Medium | Lean red meat-like poultry |
| Beef | Red meat | Cooked lean | 250 | 26.1 | 0.0 | 15.4 | 0.0 | 0.0 | 72 | High | Cut and fat level vary |
| Ground beef | Red meat | Cooked 85% lean | 250 | 26.0 | 0.0 | 15.0 | 0.0 | 0.0 | 72 | High | Fat percent changes calories |
| Steak | Red meat | Cooked lean | 271 | 25.0 | 0.0 | 19.0 | 0.0 | 0.0 | 58 | Medium | Cut varies |
| Goat | Red meat | Cooked | 143 | 27.1 | 0.0 | 3.0 | 0.0 | 0.0 | 86 | Medium | Lean meat baseline |
| Lamb | Red meat | Cooked | 294 | 25.6 | 0.0 | 20.9 | 0.0 | 0.0 | 72 | High | Cut and trim vary |
| Mutton | Red meat | Cooked | 294 | 25.6 | 0.0 | 20.9 | 0.0 | 0.0 | 72 | Medium | Similar to lamb if exact match unavailable |
| Pork | Red meat | Cooked lean | 242 | 27.3 | 0.0 | 13.9 | 0.0 | 0.0 | 62 | High | Cut and trim vary |
| Ham | Processed meat | Roasted/cured | 145 | 21.0 | 1.5 | 5.5 | 0.0 | 1.5 | 1200 | Medium | Sodium varies by product |
| Bison | Red meat | Cooked | 179 | 28.4 | 0.0 | 6.4 | 0.0 | 0.0 | 70 | Medium | Lean game meat |
| Deer | Game meat | Cooked | 158 | 30.2 | 0.0 | 3.2 | 0.0 | 0.0 | 65 | Medium | Venison baseline |
| Elk | Game meat | Cooked | 146 | 30.2 | 0.0 | 1.9 | 0.0 | 0.0 | 65 | Medium | Lean game meat |
| Rabbit | Game meat | Cooked | 173 | 33.0 | 0.0 | 3.5 | 0.0 | 0.0 | 45 | Medium | Lean meat |
| Venison | Game meat | Cooked | 158 | 30.2 | 0.0 | 3.2 | 0.0 | 0.0 | 65 | Medium | Same as deer |
| Liver | Organ meat | Cooked beef | 191 | 29.1 | 5.1 | 5.3 | 0.0 | 0.0 | 78 | High | Very high vitamin A and iron |
| Kidney | Organ meat | Cooked beef | 158 | 27.3 | 0.0 | 4.6 | 0.0 | 0.0 | 94 | Medium | Organ meat |
| Heart | Organ meat | Cooked beef | 185 | 28.5 | 0.1 | 7.5 | 0.0 | 0.0 | 59 | Medium | Organ meat |
| Sausage | Processed meat | Cooked pork | 301 | 12.0 | 2.0 | 27.0 | 0.0 | 1.0 | 848 | Medium | Product varies widely |
| Bacon | Processed meat | Cooked | 541 | 37.0 | 1.4 | 42.0 | 0.0 | 0.0 | 1717 | Medium | Sodium and fat high |
| Salami | Processed meat | Cured | 336 | 21.9 | 2.4 | 26.7 | 0.0 | 0.7 | 1740 | Medium | Product varies |
| Deli chicken | Processed meat | Sliced | 110 | 18.0 | 2.0 | 3.0 | 0.0 | 1.0 | 1000 | Low | Brand and sodium vary |
| Deli ham | Processed meat | Sliced | 145 | 21.0 | 1.5 | 5.5 | 0.0 | 1.5 | 1200 | Medium | Sodium varies |
| Deli turkey | Processed meat | Sliced | 104 | 17.1 | 4.2 | 1.7 | 0.0 | 3.0 | 1038 | Medium | Product varies |
| Chicken egg | Egg | Whole raw | 143 | 12.6 | 0.7 | 9.5 | 0.0 | 0.4 | 142 | High | About 50 g per large egg |
| Duck egg | Egg | Whole raw | 185 | 12.8 | 1.5 | 13.8 | 0.0 | 0.9 | 146 | Medium | Larger than chicken egg |
| Egg white | Egg | Raw | 52 | 10.9 | 0.7 | 0.2 | 0.0 | 0.7 | 166 | High | Mostly protein |
| Egg yolk | Egg | Raw | 322 | 15.9 | 3.6 | 26.5 | 0.0 | 0.6 | 48 | High | High fat and cholesterol |
| Anchovy | Seafood | Raw | 131 | 20.4 | 0.0 | 4.8 | 0.0 | 0.0 | 104 | Medium | Canned salted is much higher sodium |
| Black sea bass | Seafood | Raw | 97 | 18.4 | 0.0 | 2.0 | 0.0 | 0.0 | 68 | Medium | Fish variety |
| Catfish | Seafood | Raw | 105 | 18.5 | 0.0 | 2.9 | 0.0 | 0.0 | 50 | High | Farmed/wild differs |
| Cod | Seafood | Raw | 82 | 17.8 | 0.0 | 0.7 | 0.0 | 0.0 | 54 | High | Lean fish |
| Flounder | Seafood | Raw | 86 | 15.2 | 0.0 | 2.4 | 0.0 | 0.0 | 81 | High | Flatfish |
| Freshwater trout | Seafood | Raw | 119 | 20.5 | 0.0 | 3.5 | 0.0 | 0.0 | 52 | High | Fish |
| Haddock | Seafood | Raw | 74 | 16.3 | 0.0 | 0.5 | 0.0 | 0.0 | 213 | High | Sodium varies |
| Hake | Seafood | Raw | 71 | 16.0 | 0.0 | 0.7 | 0.0 | 0.0 | 72 | Medium | Lean fish |
| Halibut | Seafood | Raw | 91 | 18.6 | 0.0 | 1.3 | 0.0 | 0.0 | 68 | High | Lean fish |
| Herring | Seafood | Raw | 158 | 18.0 | 0.0 | 9.0 | 0.0 | 0.0 | 90 | High | Oily fish |
| Light tuna | Seafood | Canned in water drained | 116 | 25.5 | 0.0 | 0.8 | 0.0 | 0.0 | 338 | High | Sodium depends on canning |
| Mackerel | Seafood | Raw | 205 | 18.6 | 0.0 | 13.9 | 0.0 | 0.0 | 90 | High | Oily fish |
| Mullet | Seafood | Raw | 117 | 19.4 | 0.0 | 3.8 | 0.0 | 0.0 | 65 | Medium | Fish |
| Perch | Seafood | Raw | 91 | 19.4 | 0.0 | 0.9 | 0.0 | 0.0 | 62 | Medium | Fish |
| Pollock | Seafood | Raw | 92 | 19.4 | 0.0 | 1.0 | 0.0 | 0.0 | 86 | High | Lean fish |
| Salmon | Seafood | Raw Atlantic | 208 | 20.4 | 0.0 | 13.4 | 0.0 | 0.0 | 59 | High | Oily fish |
| Sardine | Seafood | Canned in oil drained | 208 | 24.6 | 0.0 | 11.5 | 0.0 | 0.0 | 505 | High | Canned sodium varies |
| Sea bass | Seafood | Raw | 97 | 18.4 | 0.0 | 2.0 | 0.0 | 0.0 | 68 | Medium | Representative bass |
| Snapper | Seafood | Raw | 100 | 20.5 | 0.0 | 1.3 | 0.0 | 0.0 | 64 | High | Lean fish |
| Sole | Seafood | Raw | 86 | 15.2 | 0.0 | 2.4 | 0.0 | 0.0 | 81 | Medium | Similar to flounder |
| Tilapia | Seafood | Raw | 96 | 20.1 | 0.0 | 1.7 | 0.0 | 0.0 | 52 | High | Lean fish |
| Whiting | Seafood | Raw | 90 | 18.3 | 0.0 | 1.3 | 0.0 | 0.0 | 68 | Medium | Lean fish |
| Clam | Seafood | Cooked moist heat | 148 | 25.6 | 5.1 | 2.0 | 0.0 | 0.0 | 1202 | Medium | Sodium varies by species/prep |
| Crab | Seafood | Cooked | 97 | 19.4 | 0.0 | 1.5 | 0.0 | 0.0 | 1072 | Medium | Sodium varies |
| Crayfish | Seafood | Cooked | 82 | 16.8 | 0.0 | 1.2 | 0.0 | 0.0 | 97 | Medium | Shellfish |
| Lobster | Seafood | Cooked | 89 | 19.0 | 0.0 | 0.9 | 0.0 | 0.0 | 486 | High | Sodium varies |
| Mussel | Seafood | Cooked | 172 | 23.8 | 7.4 | 4.5 | 0.0 | 0.0 | 369 | Medium | Shellfish |
| Octopus | Seafood | Cooked | 164 | 29.8 | 4.4 | 2.1 | 0.0 | 0.0 | 460 | Medium | Seafood |
| Oyster | Seafood | Raw | 68 | 7.0 | 3.9 | 2.5 | 0.0 | 0.0 | 90 | Medium | Species varies |
| Scallop | Seafood | Cooked | 111 | 20.5 | 5.4 | 0.8 | 0.0 | 0.0 | 667 | Medium | Sodium varies |
| Shrimp | Seafood | Cooked | 99 | 24.0 | 0.2 | 0.3 | 0.0 | 0.0 | 111 | High | Plain cooked |
| Squid | Seafood | Cooked | 175 | 17.9 | 7.8 | 7.5 | 0.0 | 0.0 | 306 | Medium | Fried squid much higher |
| Tofu | Plant protein | Firm | 144 | 17.3 | 2.8 | 8.7 | 2.3 | 0.6 | 14 | High | Calcium-set tofu may be higher calcium |
| Tempeh | Plant protein | Fermented soy | 192 | 20.3 | 7.6 | 10.8 | 0.0 | 0.0 | 9 | High | Soy protein |
| Textured vegetable protein | Plant protein | Dry | 333 | 52.9 | 33.9 | 1.2 | 17.5 | 9.3 | 20 | Medium | Rehydrated values lower |
| Seitan | Plant protein | Prepared | 370 | 75.2 | 13.8 | 1.9 | 0.6 | 0.0 | 29 | Medium | Sodium varies by recipe |
| Soy chunks | Plant protein | Dry | 345 | 52.0 | 33.0 | 0.5 | 13.0 | 7.0 | 5 | Low | Rehydrated values lower |
| Soy milk | Dairy alternative | Unsweetened | 33 | 2.9 | 1.7 | 1.6 | 0.4 | 0.4 | 38 | Medium | Fortification varies |
| Soy yogurt | Dairy alternative | Plain | 66 | 3.5 | 9.7 | 1.8 | 0.6 | 6.0 | 40 | Low | Brand varies |
| Almond | Nut/Seed | Raw | 579 | 21.2 | 21.6 | 49.9 | 12.5 | 4.4 | 1 | High | Nut |
| Cashew | Nut/Seed | Raw | 553 | 18.2 | 30.2 | 43.9 | 3.3 | 5.9 | 12 | High | Nut |
| Peanut | Nut/Seed | Raw | 567 | 25.8 | 16.1 | 49.2 | 8.5 | 4.7 | 18 | High | Legume used as nut |
| Pistachio | Nut/Seed | Raw | 560 | 20.2 | 27.2 | 45.3 | 10.6 | 7.7 | 1 | High | Nut |
| Walnut | Nut/Seed | Raw | 654 | 15.2 | 13.7 | 65.2 | 6.7 | 2.6 | 2 | High | Nut |
| Chia seeds | Nut/Seed | Dry | 486 | 16.5 | 42.1 | 30.7 | 34.4 | 0.0 | 16 | High | High fiber seed |
| Flax seeds | Nut/Seed | Dry | 534 | 18.3 | 28.9 | 42.2 | 27.3 | 1.6 | 30 | High | High fiber seed |
| Pumpkin seeds | Nut/Seed | Dry kernels | 559 | 30.2 | 10.7 | 49.1 | 6.0 | 1.4 | 7 | High | Pepitas |
| Sesame seeds | Nut/Seed | Dry | 573 | 17.7 | 23.4 | 49.7 | 11.8 | 0.3 | 11 | High | Seed |
| Sunflower seeds | Nut/Seed | Dry kernels | 584 | 20.8 | 20.0 | 51.5 | 8.6 | 2.6 | 9 | High | Seed |
| Tahini | Nut/Seed paste | Sesame paste | 595 | 17.0 | 21.2 | 53.8 | 9.3 | 0.5 | 115 | Medium | Brand varies |
| Barley | Grain | Pearled cooked | 123 | 2.3 | 28.2 | 0.4 | 3.8 | 0.3 | 3 | High | Cooked value |
| Buckwheat | Grain | Cooked groats | 92 | 3.4 | 19.9 | 0.6 | 2.7 | 0.9 | 4 | High | Cooked value |
| Bulgur | Grain | Cooked | 83 | 3.1 | 18.6 | 0.2 | 4.5 | 0.1 | 5 | High | Cooked value |
| Cornmeal | Grain | Dry whole-grain | 362 | 8.1 | 76.9 | 3.6 | 7.3 | 0.6 | 35 | Medium | Dry value |
| Couscous | Grain | Cooked | 112 | 3.8 | 23.2 | 0.2 | 1.4 | 0.1 | 5 | High | Cooked value |
| Millet | Grain | Cooked | 119 | 3.5 | 23.7 | 1.0 | 1.3 | 0.1 | 2 | High | Cooked value |
| Oats | Grain | Dry rolled | 389 | 16.9 | 66.3 | 6.9 | 10.6 | 0.9 | 2 | High | Dry value |
| Oatmeal | Grain | Cooked with water | 71 | 2.5 | 12.0 | 1.5 | 1.7 | 0.3 | 49 | High | Cooked value |
| Pasta | Grain | Cooked | 158 | 5.8 | 30.9 | 0.9 | 1.8 | 0.6 | 1 | High | Plain cooked |
| Quinoa | Grain | Cooked | 120 | 4.4 | 21.3 | 1.9 | 2.8 | 0.9 | 7 | High | Cooked value |
| Rice | Grain | Cooked white | 130 | 2.7 | 28.2 | 0.3 | 0.4 | 0.1 | 1 | High | Plain cooked |
| Brown rice | Grain | Cooked | 123 | 2.7 | 25.6 | 1.0 | 1.6 | 0.2 | 4 | High | Plain cooked |
| White rice | Grain | Cooked | 130 | 2.7 | 28.2 | 0.3 | 0.4 | 0.1 | 1 | High | Plain cooked |
| Rye | Grain | Whole grain | 338 | 10.3 | 75.9 | 1.6 | 15.1 | 1.0 | 2 | Medium | Dry grain |
| Sorghum | Grain | Dry | 329 | 10.6 | 72.1 | 3.5 | 6.7 | 2.5 | 2 | Medium | Dry grain |
| Teff | Grain | Dry | 367 | 13.3 | 73.1 | 2.4 | 8.0 | 1.8 | 12 | Medium | Dry grain |
| Wheat | Grain | Hard red dry | 340 | 13.2 | 71.2 | 2.5 | 10.7 | 0.4 | 2 | Medium | Dry grain |
| Wheat flour | Grain | All-purpose | 364 | 10.3 | 76.3 | 1.0 | 2.7 | 0.3 | 2 | High | Dry flour |
| Wild rice | Grain | Cooked | 101 | 4.0 | 21.3 | 0.3 | 1.8 | 0.7 | 3 | High | Cooked value |
| Bagel | Bread | Plain | 250 | 10.2 | 48.9 | 1.5 | 2.1 | 5.0 | 439 | Medium | Product varies |
| Biscuit | Bread | Plain | 353 | 7.0 | 44.6 | 16.3 | 1.5 | 2.2 | 580 | Medium | Recipe varies |
| Bread | Bread | White | 265 | 9.0 | 49.0 | 3.2 | 2.7 | 5.0 | 491 | Medium | Bread type varies |
| Chapati | Flatbread | Plain | 297 | 10.0 | 46.0 | 7.0 | 4.9 | 2.0 | 300 | Low | Recipe and oil vary |
| Cornbread | Bread | Prepared | 330 | 6.6 | 44.0 | 14.0 | 1.8 | 9.6 | 599 | Medium | Recipe varies |
| Cracker | Bread | Saltine | 421 | 9.0 | 74.0 | 9.0 | 2.7 | 0.7 | 1100 | Medium | Product varies |
| Dosa | Flatbread | Plain | 168 | 3.9 | 29.0 | 3.7 | 1.2 | 0.5 | 190 | Low | Oil and batter vary |
| English muffin | Bread | Plain | 227 | 8.9 | 44.2 | 1.7 | 3.5 | 2.0 | 425 | Medium | Product varies |
| Idli | Steamed cake | Plain | 128 | 4.3 | 25.0 | 0.6 | 1.5 | 0.3 | 130 | Low | Batter and size vary |
| Injera | Flatbread | Teff | 166 | 5.0 | 35.0 | 0.7 | 3.0 | 1.0 | 10 | Low | Recipe varies |
| Naan | Flatbread | Plain | 310 | 9.0 | 52.0 | 7.0 | 2.0 | 3.5 | 550 | Low | Recipe varies |
| Pancake | Bread | Plain prepared | 227 | 6.4 | 28.3 | 9.7 | 1.0 | 5.9 | 439 | Medium | Syrup not included |
| Pita | Bread | White | 275 | 9.1 | 55.7 | 1.2 | 2.2 | 1.3 | 536 | Medium | Product varies |
| Roti | Flatbread | Plain | 297 | 10.0 | 46.0 | 7.0 | 4.9 | 2.0 | 300 | Low | Same baseline as chapati |
| Tortilla | Flatbread | Flour | 304 | 8.9 | 48.2 | 8.4 | 2.4 | 2.6 | 732 | Medium | Corn tortillas differ |
| Milk | Dairy | Whole | 61 | 3.2 | 4.8 | 3.3 | 0.0 | 5.1 | 43 | High | Fluid milk |
| Yogurt | Dairy | Plain whole milk | 61 | 3.5 | 4.7 | 3.3 | 0.0 | 4.7 | 46 | High | Greek yogurt differs |
| Curd | Dairy | Plain yogurt style | 61 | 3.5 | 4.7 | 3.3 | 0.0 | 4.7 | 46 | Medium | Use yogurt baseline |
| Cheese | Dairy | Cheddar | 403 | 24.9 | 1.3 | 33.1 | 0.0 | 0.5 | 621 | High | Cheese type varies |
| Paneer | Dairy | Fresh cheese | 296 | 18.3 | 4.5 | 22.0 | 0.0 | 2.0 | 22 | Low | Homemade/commercial varies |
| Cottage cheese | Dairy | Low-fat 2% | 81 | 10.5 | 4.3 | 2.3 | 0.0 | 4.1 | 364 | High | Sodium varies |
| Mozzarella | Dairy | Whole milk | 300 | 22.2 | 2.2 | 22.4 | 0.0 | 1.0 | 627 | High | Cheese |
| Cheddar | Dairy | Cheese | 403 | 24.9 | 1.3 | 33.1 | 0.0 | 0.5 | 621 | High | Cheese |
| Halloumi | Dairy | Cheese | 321 | 21.4 | 2.2 | 25.0 | 0.0 | 2.0 | 1250 | Low | Sodium varies widely |
| Cream | Dairy | Heavy | 340 | 2.8 | 2.8 | 36.1 | 0.0 | 2.9 | 27 | High | Heavy cream |
| Butter | Dairy fat | Salted | 717 | 0.9 | 0.1 | 81.1 | 0.0 | 0.1 | 643 | High | Salted baseline |
| Ghee | Dairy fat | Clarified butter | 900 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | Medium | Nearly pure fat |
| Olive oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 2 | High | Pure oil |
| Canola oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | Pure oil |
| Sunflower oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | Pure oil |
| Soybean oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | Pure oil |
| Peanut oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | Pure oil |
| Coconut oil | Oil | Liquid/solid | 892 | 0.0 | 0.0 | 99.1 | 0.0 | 0.0 | 0 | High | High saturated fat |
| Sesame oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | Pure oil |
| Mustard oil | Oil | Liquid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | Medium | Pure oil |
| Palm oil | Oil | Liquid/solid | 884 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | High saturated fat |
| Lard | Animal fat | Rendered | 902 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | High | Animal fat |
| Beef tallow | Animal fat | Rendered | 902 | 0.0 | 0.0 | 100.0 | 0.0 | 0.0 | 0 | Medium | Animal fat |
| Sugar | Sweetener | Granulated | 387 | 0.0 | 100.0 | 0.0 | 0.0 | 99.8 | 1 | High | Added sugar |
| Honey | Sweetener | Liquid | 304 | 0.3 | 82.4 | 0.0 | 0.2 | 82.1 | 4 | High | Added sugar |
| Maple syrup | Sweetener | Liquid | 260 | 0.0 | 67.0 | 0.1 | 0.0 | 60.5 | 12 | High | Added sugar |
| Jaggery | Sweetener | Solid | 383 | 0.4 | 98.0 | 0.1 | 0.0 | 97.0 | 30 | Low | Product varies |
| Molasses | Sweetener | Liquid | 290 | 0.0 | 74.7 | 0.1 | 0.0 | 74.7 | 37 | High | Added sugar |
| Soy sauce | Condiment | Regular | 53 | 8.1 | 4.9 | 0.6 | 0.8 | 0.4 | 5493 | High | Very high sodium |
| Fish sauce | Condiment | Regular | 35 | 5.1 | 3.6 | 0.0 | 0.0 | 3.6 | 7851 | Medium | Very high sodium |
| Vinegar | Condiment | Distilled | 18 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 2 | High | Usually small amounts |
| Ketchup | Condiment | Regular | 112 | 1.3 | 27.4 | 0.2 | 0.3 | 22.8 | 907 | High | Added sugar and sodium |
| Mustard | Condiment | Prepared yellow | 66 | 4.4 | 5.8 | 4.0 | 4.0 | 0.9 | 1135 | High | Sodium varies |
| Mayonnaise | Condiment | Regular | 680 | 1.0 | 0.6 | 75.0 | 0.0 | 0.6 | 635 | High | Mostly fat |
| Hot sauce | Condiment | Pepper sauce | 11 | 0.5 | 1.8 | 0.4 | 0.3 | 0.5 | 2643 | Medium | Sodium varies widely |
| Salsa | Condiment | Ready-to-serve | 36 | 1.5 | 7.0 | 0.2 | 1.4 | 3.5 | 430 | Medium | Sodium varies |
