## story's requirements
- Save them in the nursing_notes collection
- Datetime based on the server time but calculated according to the logged user's location.
- Note list: 
    * The user will have a list of residents in the form of a residents picture's collection. Each picture will be associated to its correspondent resident id. 
    * The filter by resident must be according to their id in the nursing_notes collection.
    * This search also must allow the user to select the name of the resident from an autocomplete textbox which will be filtering the list while the user writes 3 or more letter of a resident's name.
    * When a resident photo is selected the list of resident nursing notes will be displayed sorted newest first, allowing filtering by date + shift (by default) and paginated to 20 records by default. 
    * This residents notes must allow the user to search by keywords whithin the evolution notes. E.g: fever, accident, head, knee, etc
- New note form: Since the resident is already selected (because the list is filtered by them) the way to add a new evolution note is to show a text area on top of the list accompanied by a Guardar (Save in english) button. When the user enter a note and hit Guardar button, that evolution note will be saved in the nursing_notes collection grabbing the data like this:
    * resident_id (the selected one from the list), 
    * company_id: from the logged user session,
    * date: datetime:  by default,
    * shift: by default, depending on the datetime,
    * notes: what the user enters,
    * nurse_id: from the logged user session,
    * nurse_name: from the logged user session,
    * created_at: by default
- Note detail view: (read-only) Must include all the fields of the collection. The resident name and company name must be brought from their collections.
- To test this story, create dummy records on nursing_notes and residents_collection.