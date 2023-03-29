INSERT INTO exercises(title, description, constants, predicates, functions, constraints)
VALUES(
       'sformalizujte',
       'No description',
       'NoConstant',
       'chlapec/1, dievca/1, predmet/1, profesor/1, student/1, ucitel/1, spokojny/1, vyberovy/1, absolvoval/2, kamarat/2, skolitel/2, zapisany/2, spoluziaci/2, lepsi_kamarat/3',
       'NoFunction/1', '');

INSERT INTO propositions(proposition, exercise_id)
VALUES('Je aspoň jeden študent, ktorý je chlapec, a jedna študentka (ktorá je teda dievča), a sú spolužiaci.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Učiteľ, ktorý je profesorom, musí byť školiteľom aspoň jedného študenta.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Vzťah „byť spolužiakom“ je symetrický a tranzitívny.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Študenti a školitelia sú disjunktní.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Študent absolvuje predmet, iba ak ho má zapísaný.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Študent, ktorý absolvoval predmet, je spokojný.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Každý študent má medzi študentami aspoň dvoch kamarátov, pričom s jedným sa kamaráti viac než s tým druhým.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Každý študent má najviac jedného školiteľa.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Každá študentka má práve jednu spolužiačku, ktorá jej je najlepšia kamarátka.', 1);
INSERT INTO propositions(proposition, exercise_id)
VALUES('Nikto si nezapisuje výberové predmety.', 1);

INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∃x ∃y(student(x) ∧ chlapec(x) ∧ student(y) ∧ dievca(y) ∧ spoluziaci(x, y))', '', 1);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ( (ucitel(x) ∧ profesor(x)) → ∃y (student(y) ∧ skolitel(x, y)) )', '', 2);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ∀z ( ∃y(spoluziaci(x, y) ∧ spoluziaci(y, z)) → spoluziaci(x, z) )', '', 3);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x(student(x) → ¬ ∃y skolitel(x, y))', '', 4);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ∀y ( (student(x) ∧ absolvoval(x, y) ∧ predmet(y)) → zapisany(x, y))', '', 5);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ( ( student(x) ∧ ∃y(predmet(y) ∧ absolvoval(x, y)) ) → spokojny(x) )', '', 6);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ( student(x) → ∃y ∃z(¬ z ≐ y ∧ student(y) ∧ student(z) ∧ kamarat(x, y) ∧ kamarat(x, z) ∧ lepsi_kamarat(x, y, z) ∧ ¬ z ≐ x ∧ ¬ y ≐ x) )', '', 7);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ∀y ( (student(x) ∧ skolitel(y, x)) → ∀z(skolitel(z, x) → z ≐ y) )', '', 8);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ∀y ( (student(x) ∧ skolitel(y, x)) → ¬ ∃z(skolitel(z, x) ∧ ¬ z ≐ y) )', '', 8);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ( student(x) → ∀y ∀z( ( skolitel(y, x) ∧ skolitel(z, x) ) → y ≐ z) )', '', 8);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('∀x ( student(x) ∧ dievca(x) →( ∃y (student(y) ∧ dievca(y) ∧ spoluziaci(x,y) ∧ kamarat(x,y) ∧ ¬ ∃z( lepsi_kamarat(x, z, y) ∧ ¬ z ≐ y ) ) ) )', '', 9);
INSERT INTO formalizations(formalization, constraints, proposition_id)
    VALUES('¬ ∃x ∃y(predmet(y) ∧ vyberovy(y) ∧ zapisany(x, y))', '', 10);
