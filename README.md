# Kolory Pamięci

Minimalistyczny, interaktywny projekt o polskiej sztuce ludowej, pamięci, kolorze i ludzkiej twórczości.

## Filozofia projektu

- Człowiek wybiera obrazy, ustala styl i interpretuje wyniki.
- JavaScript analizuje piksele i grupuje kolory algorytmem k-means.
- Projekt nie generuje obrazów ani nie używa generatywnej AI w działającej stronie.
- AI może być używana jako pomoc przy pisaniu i debugowaniu kodu.

## Uruchomienie lokalne

Najprościej otworzyć `index.html` w nowoczesnej przeglądarce. Jeśli przeglądarka ogranicza funkcje lokalnych plików, uruchom prosty serwer lokalny lub użyj GitHub Pages.

## Publikacja na GitHub Pages

1. Utwórz publiczne repozytorium GitHub o nazwie `kolory-pamieci`.
2. Wgraj `index.html`, `style.css`, `script.js`, `README.md` i `SOURCES.md`.
3. W repozytorium wybierz **Settings → Pages**.
4. Jako źródło wybierz **Deploy from a branch**, branch `main`, folder `/ (root)`, i zapisz.
5. Poczekaj na zakończenie wdrożenia i sprawdź stronę na telefonie oraz komputerze.

## Ważne przed publikacją

- Schematyczny zarys Polski jest poglądowy, nie kartograficznie dokładny.
- Dodaj własne fotografie lub obrazy, do których masz prawa. Nie przedstawiaj ich jako wygenerowanych przez stronę.
- Uzupełnij `SOURCES.md` o autora, tytuł, link źródłowy, licencję i datę dostępu dla każdego użytego dzieła.
- Dodaj własne, konkretne wspomnienia do tekstu, aby część osobista rzeczywiście odzwierciedlała Twoje doświadczenia.
- Sprawdź wymagania konkursu dotyczące formy zgłoszenia. Jeśli wymagany jest film, sama strona może nie wystarczyć — zapytaj organizatorów, czy link do interaktywnego projektu jest akceptowany.

## Jak działa analiza

Obraz jest zmniejszany do maksymalnego wymiaru 180 px, następnie program pobiera próbki pikseli. Każdy piksel jest reprezentowany przez trzy liczby RGB. Algorytm k-means grupuje próbki w wybraną liczbę klastrów; środek klastra służy jako kolor reprezentatywny. Procent oznacza udział próbek przypisanych do danego klastra, a nie dokładny udział powierzchni obiektu na oryginalnym zdjęciu.
