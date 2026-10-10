# Kolory Mojej Polski

Kolor może przywoływać miejsce, skojarzenie albo wspomnienie. Inspiracją do tego projektu jest moja więź z Polską, Kraków — rodzinne miasto moich rodziców — oraz tradycyjna sztuka ludowa, w tym ceramika z Bolesławca. Chciałam przyjżeć się bliżej charasterystycznom kolorom rzeczy które representują moją relacje z polską, jej kulturą, oraz jej codziennym życiem.

Przy pomocy AI, utworzyłam prostą strukture strony oraz główny algorytm identykowania centralnych barwów użytych zdjęć. Algorytm używa K-means clustering, matematyczną metode znajdując podobieństwa elementów danych (w tym projekcie, kolory). Ta strategia to troche skomplikowana na moje umiejętności jako uczeń w klasie II liceum, ale nauczyłam się jego teoretycznego zastosowania 2-3 lata temu. Sztuczna inteligencja pozwoliła mi zastosować tą metodę bez ręcznego wypracowania matematyki; nie podejmuje jednak za mnie decyzji artystycznych. Dobór dzieł, forma strony i interpretacja zdjęć należą do mnie.

Myszką można wybrać punkty na uproszczonej mapie schematycznej, a program pokazuje wybrane przeze mnie zdjęcie wraz z związanymi szczegółami. Kolorystyka strony zmienia się na algorytmicznie wybrane kolory zdjęcia, aby zbudzić emocje w oglądającym. Potem można wybrać własny obraz, aby podobnie zbadać jego kolory i stworzyć sztuke na jej podstawie.

## Filozofia projektu
- Ja ręcznie wybrałam temat i zdjęcia.
- JavaScript analizuje piksele i grupuje kolory algorytmem k-means.
- Projekt nie generuje obrazów ani nie używa generatywnej AI w działającej stronie.
- AI był używany jako pomoc przy debugowaniu kodu.

## Jak działa analiza

Obraz jest zmniejszany do maksymalnego wymiaru 180 px, następnie program pobiera próbki pikseli. Każdy piksel jest reprezentowany przez trzy liczby RGB. Algorytm k-means grupuje próbki w wybraną liczbę klastrów; środek klastra służy jako kolor reprezentatywny. Procent oznacza udział próbek przypisanych do danego klastra, a nie dokładny udział powierzchni obiektu na oryginalnym zdjęciu.

## Jak Zobaczyć

Proszę wejść na stronę internetową [https://strelitziaxx.github.io/kolorymojejpolski/].
