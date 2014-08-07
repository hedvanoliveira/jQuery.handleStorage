# Depreciated, succeeded by [secStore.js](https://github.com/jas-/secStore.js)

#jQuery plugin to impliment HTML5 form storage

Supports HTML5 localStorage, sessionStorage or cookie support
for older browsers. Optional AES encryption support. Optional
degraded cookie support (with plug-in, see *requirements). Now
supports auto-save for form elements to prevent loss of work
prior to form submission.

  Fork me @ https://www.github.com/jas-/jQuery.handleStorage

## REQUIREMENTS:
* jQuery libraries (required - http://www.jquery.com)
* jQuery cookie plugin (optional - http://plugins.jquery.com/files/jquery.cookie.js.txt)
* Gibberish-AES libraries (optional - https://github.com/mdp/gibberish-aes)


## FEATURES:
* HTML5 localStorage support
* HTML5 sessionStorage support
* Cookie support
* AES encryption support
* Quota support (4k for cookies and 5mb for HTML5 mechanisms)

## OPTIONS:
* appID:       Unique application identifier
* interval:    Auto-save interval (default is 5sec)
* storage:     HTML5 localStorage, sessionStorage and cookies supported
* aes:         Use AES encryption for client storage objects
* callback:    Executes a callback function on success saves
* preCallback: Executes a callback function prior to any saves
* errCallback: Executes a callback function when any save was unsuccessful

## NOTES:
A quick note on security. Currently (02.17.2012), a cross-domain bypass
proof of concept vulnerability exists. Reference: http://www.securityfocus.com/bid/51765/discuss

To help protect sensitive data employing the optional AES feature will
assist in protecting the client storage information, moreover, local browser
compromises exist when two people use the same machine. If you would like to
provide the more secure method of saving form data the use of the 'sessionStorage'
option will provide a 'per session' method of auto-saving to the client storage
mechanisms. Additionally the use of the optional AES encryption feature will
provide transparent encryption of the auto-saving features this plug-in
provides.

## EXAMPLES:

### localStorage examples:
The localStorage option within HTML5 allows for persistent client storage of
key/value pairs. This is the default method of client storage.

#### Default usage using HTML5 localStorage
The default use is simple and users persistent storage by implementing the HTML5
localStorage option

```javascript
$('#form').handleStorage();
```

#### Default usage using HTML5 localStorage with custom appID
By specifying the appID variable you can separate multiple forms as the default
use will combine all forms into sub-objects of the default appID

```javascript
$('#form').handleStorage({appID:'myWickedApp'});
```

#### Default usage using HTML5 localStorage with custom auto-save interval
You have the option of specifying the interval of the auto-save feature. Currently
the default is 5 seconds. In this example we specify 30 seconds.

```javascript
$('#form').handleStorage({interval:30000});
```

#### Default usage using HTML5 localStorage with AES encryption
If you wish to use persistent storage and provide some additional security
to the saved form data a transparent AES-CBC encryption method is available.
This option does require the Gibberish-AES plug-in as noted above.

```javascript
$('#form').handleStorage({aes:true});
```

### sessionStorage examples:
Specifying the sessionStorage option allows for client storage of form data ONLY
while the users browser is open. This is the more secure option in terms of a
web application which requires authentication.

#### Default usage using HTML5 sessionStorage
An example of using the sessionStorage HTML5 option

```javascript
$('#form').handleStorage({storage:'sessionStorage'});
```

#### Default usage using HTML5 sessionStorage with custom appID
Here is an example of specifying the sessionStorage option with a custom
appID for client storage.

```javascript
$('#form').handleStorage({storage:'sessionStorage',appID:'myWickedApp'});
```

#### Default usage using HTML5 sessionStorage with custom auto-save interval
You have the option of specifying the interval of the auto-save feature. Currently
the default is 5 seconds. In this example we specify 30 seconds.

```javascript
$('#form').handleStorage({storage:'sessionStorage',interval:30000});
```

#### Default usage using HTML5 sessionStorage with AES encryption
This example provides the best security of client storage data as the client
closes their browser the data gets reset and while the users browser is open
the data is encrypted with the AES-CBC cipher

```javascript
$('#form').handleStorage({storage:'sessionStorage',aes:true});
```

### cookie storage examples:

#### Default usage using cookies for client storage
For those users that are still using older browsers option cookie storage is
available but requires the jquery cookie plugin (see above for URL)

```javascript
$('#form').handleStorage({storage:'cookies'});
```

#### Default usage using cookies for client storage with custom appID
An example using cookies with a custom appID (good for multiple forms if you
wish to segregate the storage objects)

```javascript
$('#form').handleStorage({storage:'cookies',appID:'myWickedApp'});
```

#### Default usage using cookies with custom auto-save interval
You have the option of specifying the interval of the auto-save feature. Currently
the default is 5 seconds. In this example we specify 30 seconds.

```javascript
$('#form').handleStorage({storage:'cookies',interval:30000});
```

#### Default usage using cookies for client storage with AES encryption
An example using AES-CBC encryption with degraded cookie support.

```javascript
$('#form').handleStorage({storage:'cookies',aes:true});
```

### Using callback options
Because responsive UI's are all the rage I have added a couple of callback options
to help you provide this to your clients.

#### Pre-Callback example
Here is an example of executing a function before the auto-incrementing or form
submit event has been called.

```javascript
$('#form').handleStorage({preCallback:function(){ console.log(this); }});
```

#### Callback example
This callback gets executed anytime the save has been called and was successful. Keep
in mind that this does take place ever 5 seconds with a default configuration.

```javascript
$('#form').handleStorage({callback:function(){ console.log(this); }});
```

#### errCallback example
This callback gets executed anytime a save was unsuccessful.

```javascript
$('#form').handleStorage({errCallback:function(){ console.log(this); }});
```

## OBJECT DETAILS
Here is an example of the contents of the object within any specified storage
mechanism. As you can see it is a valid JSON object that is formatted for
readability. Multiple forms can be stored within one object as shown here.
(Which is the default method of storing form data).

```
"jQuery.handleStorage": {
    "default": {
        "uuid": "cb76ax8d-6539-4151-a70d-ed0628c083d5",
        "name": "jason gerfen",
        "email": "jason.gerfen@gmail.com",
        "message": "Test #1"
    },
    "default-aes": {
        "uuid": "cb76ax8d-6539-4151-a70d-ed0628c083d5",
        "name": "U2FsdGVkX1+J6IKgOD4E/Ni/VqnNf/FwZwaHotk4Gfc=",
        "email": "U2FsdGVkX19xzInZdszNewMDlKOVZzDraUkhT2VCjtIfqgaZNYhzkKWUciUn0lCc",
        "message": "U2FsdGVkX1+s0SczDn9TOP9FSpBvJCqVpbL9wyniQcs="
    }
}
```

Or if you would like to separate objects based on forms (done by specifying
a separate 'appID' per form), this is what it would look like in the storage
mechanism.

```
"jQuery.handleStorage": {
    "default": {
        "uuid": "cb76ax8d-6539-4151-a70d-ed0628c083d5",
        "name": "jason gerfen",
        "email": "jason.gerfen@gmail.com",
        "message": "Test #1"
    }
}
"myWickedApp": {
    "default-aes": {
        "uuid": "cb76ax8d-6539-4151-a70d-ed0628c083d5",
        "name": "U2FsdGVkX1+J6IKgOD4E/Ni/VqnNf/FwZwaHotk4Gfc=",
        "email": "U2FsdGVkX19xzInZdszNewMDlKOVZzDraUkhT2VCjtIfqgaZNYhzkKWUciUn0lCc",
        "message": "U2FsdGVkX1+s0SczDn9TOP9FSpBvJCqVpbL9wyniQcs="
    }
}
```

Jason Gerfen - Licensed under the GNU Public License or GPL
