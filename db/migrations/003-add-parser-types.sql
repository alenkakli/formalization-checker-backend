ALTER TABLE exercises
ADD "parserType" varchar(255) DEFAULT 'withPrecedence' NOT NULL;

ALTER TABLE exercises
ADD CONSTRAINT typy_parserov
	CHECK  ("parserType" in ('withPrecedence', 'strict'));
