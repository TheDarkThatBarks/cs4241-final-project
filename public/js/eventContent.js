function createPersonalEvent(name, start, end, location, eventId, includeAddButton = false) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("event-wrapper");

    const headerWrapper = document.createElement("div");
    headerWrapper.classList.add("event-header");
    headerWrapper.classList.add("header");

    const eventName = document.createElement("h4");
    eventName.classList.add("header");
    eventName.textContent = name;
    headerWrapper.appendChild(eventName);

    const details = document.createElement("button");
    details.textContent = "More Details";
    details.classList.add("hoverable");
    details.classList.add("detail-button");
    details.type = "button";
    headerWrapper.appendChild(details);

    if (includeAddButton) {
        const addButton = document.createElement("button");
        addButton.textContent = "Add to calendar";
        addButton.classList.add("hoverable");
        addButton.classList.add("detail-button");
        addButton.type = "button";
        addButton.onclick = async () => addToPersonal(eventId);
        headerWrapper.appendChild(addButton);
        headerWrapper.classList.add("double-button");
    }
    wrapper.appendChild(headerWrapper);

    const timeWrapper = document.createElement("div");
    timeWrapper.classList.add("time-wrapper");
    const eventStart = document.createElement("h5");
    const startLabel = document.createElement("span");
    startLabel.textContent = "Start Time";
    const startContent = document.createElement("span");
    startContent.textContent = Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric", "hour12": true, "hour": "2-digit", "minute": "2-digit" }).format(start);
    eventStart.appendChild(startLabel);
    eventStart.appendChild(startContent);
    const eventEnd = document.createElement("h5");
    const endLabel = document.createElement("span");
    endLabel.textContent = "End Time";
    const endContent = document.createElement("span");
    endContent.textContent = Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric", "hour12": true, "hour": "2-digit", "minute": "2-digit" }).format(end);
    eventEnd.appendChild(endLabel);
    eventEnd.appendChild(endContent);

    timeWrapper.appendChild(eventStart);
    timeWrapper.appendChild(eventEnd);
    wrapper.appendChild(timeWrapper);

    const eventLocation = document.createElement("h5");
    eventLocation.classList.add("center");
    const locationLabel = document.createElement("span");
    locationLabel.textContent = "Location";
    const locationContent = document.createElement("span");
    locationContent.textContent = location;

    eventLocation.appendChild(locationLabel);
    eventLocation.appendChild(locationContent);
    wrapper.appendChild(eventLocation);

    const extraInfo = document.createElement("div");
    extraInfo.classList.add("hidden");

    const flyerWrapper = document.createElement("div");
    flyerWrapper.classList.add("center");

    const flyerLabel = document.createElement("h5");
    flyerLabel.classList.add("reduced-margin");
    flyerLabel.innerHTML = "<span>Flyer</span>";
    flyerWrapper.appendChild(flyerLabel);

    const flyer = document.createElement("img");
    flyer.style.maxWidth = "70%";
    flyer.alt = "Could not load flyer from servers...";
    flyer.classList.add("hoverable");

    const popupWrapper = document.getElementById("image-popup-wrapper");
    const popupImage = document.getElementById("image-popup");
    flyer.addEventListener("click", () => {
        popupWrapper.classList.remove("hidden");
        document.body.style.overflowY = "hidden";
        popupImage.src = flyer.src;
    });

    flyerWrapper.appendChild(flyer);
    extraInfo.appendChild(flyerWrapper);

    const descriptionLabel = document.createElement("h5");
    descriptionLabel.classList.add("reduced-margin");
    descriptionLabel.innerHTML = "<span>Event Description</span>";
    extraInfo.appendChild(descriptionLabel);

    const descriptionDiv = document.createElement("div");
    const description = new Quill(descriptionDiv, {
        placeholder: 'MESSAGE EMPTY',
        readOnly: true,
        theme: 'snow',
        modules: {
            syntax: true
        }
    });
    descriptionDiv.classList.add("centered-description");
    extraInfo.appendChild(descriptionDiv);

    details.onclick = async () => {
        await toggleInfo(flyer, descriptionLabel, descriptionDiv, description, eventId);
        if (details.textContent === "More Details") {
            details.textContent = "Less Details";
            extraInfo.classList.remove("hidden");
        } else {
            details.textContent = "More Details";
            extraInfo.classList.add("hidden");
        }
    };
    wrapper.appendChild(extraInfo);

    return wrapper;
}

async function toggleInfo(flyer, descLabel, descDiv, description, eventId) {
    const reqObj = { eventId: eventId };
    const response = await fetch("/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqObj),
    });
    const eventInfo = await response.json();

    if (eventInfo.image) {
        flyer.src = eventInfo.image;
        flyer.parentElement.classList.remove("hidden");
    } else {
        flyer.parentElement.classList.add("hidden");
    }

    if (eventInfo.description) {
        try {
            description.setContents(JSON.parse(eventInfo.description));
        } catch (_) {
            description.setText(eventInfo.description);
        }
        descLabel.classList.remove("hidden");
        descDiv.classList.remove("hidden");
    } else {
        descLabel.classList.add("hidden");
        descDiv.classList.add("hidden");
    }
};

async function addToPersonal(eventId) {
    fetch("/add-user-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventId })
    });
};