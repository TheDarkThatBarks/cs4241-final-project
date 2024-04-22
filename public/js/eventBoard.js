
// Set input boxes to empty - user does not have to delete previous entry
const resetTextBoxes = function () {
    document.querySelector("#event").value = "";
    document.querySelector("#date").value = "";
    document.querySelector("#startTime").value = "";
    document.querySelector("#endTime").value = "";

    document.querySelector("#location").value = "";
 
  };
  // Adds row to HTML table creates an event listener for each button created - can get index from click
  const addToTable = function (entry) {
    const table = document.getElementById("table");
    const row = `<tr id="entryRow">
                  <td>${entry.event}</td>
                  <td>${entry.date}</td>
                  <td>${entry.startTime}</td>
                  <td>${entry.length}</td>
                  <td>${entry.location}</td>
                  <td><button class="remove">Add To My Events</button></td>
                </tr>`;
    table.insertAdjacentHTML("beforeend", row);
    //eventlistener
    const removeButton = table.querySelector(".remove:last-child");
    removeButton.addEventListener("click", function (event) {
      event.preventDefault();
    });
    resetTextBoxes();
  };
  //clear and rebuild
  const generateTable = function (array) {
    console.log("in generate table: ", array);
    for (let i = 0; i <= array.length; i++) {
      if (document.getElementById("guestName") != undefined) {
        document.getElementById("guestName").remove();
      }
      if (document.getElementById("entryRow") != undefined) {
        document.getElementById("entryRow").remove();
      }
    }
    for (let j = 0; j < array.length; j++) {
      addToTable(array[j]);
    }
    //makeGuestList(array);
  };
  //check if input box is empty
  function isEmpty(str) {
    return !str || str.length === 0;
  }

  //creates an object and sends object to server side serverside sends back an array or JSON
  const submit = async function (event) {
    event.preventDefault();
    const eventInput = document.querySelector("#event");
    const dateInput = document.querySelector("#date");
    const startInput = document.querySelector("#startTime");
    const endInput = document.querySelector("#endTime");
    const locationInput = document.querySelector("#location");

    //check all fields complete
    if (isEmpty(eventInput.value) || isEmpty(dateInput.value) || isEmpty(startInput.value) || isEmpty(locationInput.value)) {
      alert(
        "Please fill out all fields. If the end time is unknown, you may leave it blank."
      );
      return;
    }
    const newEntry = createEntry(
      eventInput.value,
      dateInput.value,
      startInput.value,
      endInput.value,
      locationInput.value
    );
    
    const response = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    });
    const text = await response.json();
    
 
    generateTable(text);
    resetTextBoxes();
  };
  const createEntry = function (event, date, start, end, location) {
    const entry = {
      event: event,
      date: date,
      startTime: start,
      endTime: end,
      location: location
    };
    return entry;
  };

  //Check the array and compare to the name just entered - if name already in the array, do not add to list
  //If the name is not in the array, add to list -> use set for uniqeness
  const makeGuestList = function (array) {
    const uniqueNamesSet = new Set();
    const list = document.getElementById("guestList");
    list.innerHTML = ""; // Clear the existing list if needed
    array.forEach((obj) => {
      if (!uniqueNamesSet.has(obj.name)) {
        // Check if the name already exists in the set
        uniqueNamesSet.add(obj.name); // Add the name to the set
        const li = document.createElement("li");
        li.innerHTML = obj.name; // Use the name property of the object
        li.classList.add("list-group-item");
        list.appendChild(li);
      }
    });
  };
  //send empty data to server
//   const refreshPage = async function () {
//     const response = await fetch("/refresh", {
//       method: "POST",
//       body: "",
//     });
//     const text = await response.json();
//     const appdata = text.appdata;
//     const suggestdata = text.suggestdata;
//     generateTable(appdata);
//     console.log("suggest ", suggestdata);
//     clearSuggest(suggestdata);
//     makeTable(suggestdata);
//     console.log("page refreshed.");
//   };
  //send the index of the entry user wants to delete from array
  const remove = async function (entryIndex) {
    const reqObj = { entryIndex: entryIndex };
    const response = await fetch("/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqObj),
    });
    const text = await response.json();
    if (typeof text === "string") {
      alert(text);
    } else {
      generateTable(text);
    }
  };


  
//   const logout = async function (event) {
//     event.preventDefault();
//     const response = await fetch("/logout", {
//       method: "GET",
//     }).then((response) => {
//       window.location.href = "/";
//     });
//   };
  

const upload =  async function(event) {
  var input = document.getElementById('imageInput');
  var file = input.files[0];
  
  var formData = new FormData();
  formData.append('image', file);

  try {
      const response = await fetch('/upload', {
          method: 'POST',
          body: formData
      });

      if (response.ok) {
          alert('Image uploaded successfully!');
      } else {
          alert('Failed to upload image.');
      }
  } catch (error) {
      console.error('Error uploading image:', error);
  }
}

//allow user to view which file they opened
function previewImage() {
  var input = document.getElementById('imageInput');
  var file = input.files[0];

  var reader = new FileReader();
  reader.onload = function(event) {
      var imgPreview = document.getElementById('imagePreview');
      imgPreview.innerHTML = '<img src="' + event.target.result + '" width="200" alt="Preview">';
  };
  reader.readAsDataURL(file);
}

const description = async function(event){
  event.preventDefault();
  const info = document.getElementById("description").value;
  const response = await fetch("/description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: info }), // Wrap info in an object
  });
  const text = await response.json();
  if (typeof(text) === "string") {
    alert(text);
  }
}

  window.onload = function () {
    //refreshPage();
    const button = document.getElementById("submit");
    button.onclick = submit;
    const uploadButton = document.getElementById("upload");
    uploadButton.onclick = upload;
    
    const descriptionButton = document.getElementById("details");
    descriptionButton.onclick = description;
    //add event listener to call previoew image function
    document.getElementById('imageInput').addEventListener('change', previewImage);
  
    const tableEvent = document.getElementById("table");
    tableEvent.addEventListener("click", function (event) {
      event.preventDefault();
      if (event.target && event.target.classList.contains("remove")) {
        const entryIndex = event.target.closest("tr").rowIndex - 1; // Subtract 1 because of table header
        remove.onclick = remove(entryIndex);
      }
    });
  
  };
  