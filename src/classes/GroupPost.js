class GroupPost {
  constructor(
    hostUser,
    title,
    genderPreference,
    ageRange,
    groupSize,
    itinerary,
    dateTime,
    location
  ) {
    this.hostUser = hostUser;
    this.users = [hostUser]; // Initialize with the host user
    this.title = title;
    this.genderPreference = genderPreference;
    this.ageRange = ageRange;
    this.groupSize = groupSize;
    this.itinerary = itinerary;
    this.dateTime = dateTime;
    this.createdDateTime = new Date();
    this.location = location;
  }
}

export default GroupPost;
