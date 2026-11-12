const common = () => [
  [
    "headers",
    `CREATE TABLE headers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      logoUrl VARCHAR(500) NULL,
      siteTitle VARCHAR(150) NULL,
      footerText TEXT NULL,
      footerAddress VARCHAR(300) NULL,
      footerPhone VARCHAR(30) NULL,
      footerEmail VARCHAR(190) NULL,
      copyrightText VARCHAR(255) NULL,
      socialLinks JSON NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,
  ],
  [
    "pages",
    `CREATE TABLE pages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sourcePagesId BIGINT UNSIGNED NULL,
      title VARCHAR(150) NOT NULL,
      page LONGTEXT NOT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqPagesSource (sourcePagesId),
      INDEX idxPagesOrder (sortOrder, id)
    ) ENGINE=InnoDB`,
  ],
  [
    "news",
    `CREATE TABLE news (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      imageUrl VARCHAR(500) NULL,
      content TEXT NOT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      publishedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxNewsStatusDate (status, publishedAt)
    ) ENGINE=InnoDB`,
  ],
  [
    "galleries",
    `CREATE TABLE galleries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NULL,
      imageUrl VARCHAR(500) NOT NULL,
      caption VARCHAR(500) NULL,
      altText VARCHAR(255) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxGalleriesStatusOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "slider",
    `CREATE TABLE slider (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NULL,
      imageUrl VARCHAR(500) NOT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxSliderStatusOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "employees",
    `CREATE TABLE employees (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(30) NULL,
      jobTitle VARCHAR(120) NOT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxEmployeesStatusName (status, name)
    ) ENGINE=InnoDB`,
  ],
];

const school = () => [
  [
    "teachers",
    `CREATE TABLE teachers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NULL,
    phone VARCHAR(30) NULL,
    qualification VARCHAR(255) NULL,
    subjectSpecialty VARCHAR(150) NULL,
    photoUrl VARCHAR(500) NULL,
    joinedOn DATE NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idxTeachersStatus (status)
  ) ENGINE=InnoDB`,
  ],
  [
    "classes",
    `CREATE TABLE classes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      section VARCHAR(50) NULL,
      academicYear VARCHAR(20) NULL,
      classTeacherId BIGINT UNSIGNED NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxClassesStatusName (status, name),
      CONSTRAINT fkClassesTeacher FOREIGN KEY (classTeacherId)
        REFERENCES teachers(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "students",
    `CREATE TABLE students (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admissionNo VARCHAR(50) NULL,
      name VARCHAR(150) NOT NULL,
      classId BIGINT UNSIGNED NULL,
      rollNo VARCHAR(30) NULL,
      gender VARCHAR(30) NULL,
      dob DATE NULL,
      guardianName VARCHAR(150) NULL,
      guardianPhone VARCHAR(30) NULL,
      address TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqStudentsAdmissionNo (admissionNo),
      INDEX idxStudentsClassName (classId, name),
      CONSTRAINT fkStudentsClass FOREIGN KEY (classId)
        REFERENCES classes(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const medical = () => [
  [
    "departments",
    `CREATE TABLE departments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqDepartmentsName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "doctors",
    `CREATE TABLE doctors (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      departmentId BIGINT UNSIGNED NULL,
      name VARCHAR(150) NOT NULL,
      qualification VARCHAR(255) NULL,
      specialization VARCHAR(150) NULL,
      experienceYears SMALLINT UNSIGNED NULL,
      consultationFee DECIMAL(10,2) NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDoctorsDepartmentStatus (departmentId, status),
      CONSTRAINT fkDoctorsDepartment FOREIGN KEY (departmentId)
        REFERENCES departments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const ecommerce = () => [
  [
    "productcategories",
    `CREATE TABLE productcategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqProductCategoriesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "products",
    `CREATE TABLE products (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      sku VARCHAR(100) NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      salePrice DECIMAL(10,2) NULL,
      stock INT UNSIGNED NOT NULL DEFAULT 0,
      thumbnailUrl VARCHAR(500) NULL,
      attributes JSON NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqProductsSku (sku),
      INDEX idxProductsCategoryStatus (categoryId, status),
      CONSTRAINT fkProductsCategory FOREIGN KEY (categoryId)
        REFERENCES productcategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const restaurant = () => [
  [
    "menucategories",
    `CREATE TABLE menucategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqMenuCategoriesName (name),
      INDEX idxMenuCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "menuitems",
    `CREATE TABLE menuitems (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      imageUrl VARCHAR(500) NULL,
      isVeg TINYINT(1) NOT NULL DEFAULT 0,
      isSpecial TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxMenuItemsCategoryStatus (categoryId, status),
      CONSTRAINT fkMenuItemsCategory FOREIGN KEY (categoryId)
        REFERENCES menucategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "reservations",
    `CREATE TABLE reservations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      reservationDate DATE NOT NULL,
      reservationTime TIME NOT NULL,
      partySize TINYINT UNSIGNED NOT NULL,
      specialRequests TEXT NULL,
      status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxReservationsDateStatus (reservationDate, status)
    ) ENGINE=InnoDB`,
  ],
];

const hotel = () => [
  [
    "roomtypes",
    `CREATE TABLE roomtypes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      basePrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      maxOccupancy TINYINT UNSIGNED NOT NULL,
      amenities JSON NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqRoomTypesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "rooms",
    `CREATE TABLE rooms (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      roomTypeId BIGINT UNSIGNED NOT NULL,
      roomNumber VARCHAR(50) NOT NULL,
      floorNumber TINYINT UNSIGNED NULL,
      status ENUM('available','occupied','maintenance','reserved') NOT NULL DEFAULT 'available',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqRoomsNumber (roomNumber),
      INDEX idxRoomsTypeStatus (roomTypeId, status),
      CONSTRAINT fkRoomsType FOREIGN KEY (roomTypeId)
        REFERENCES roomtypes(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB`,
  ],
  [
    "bookings",
    `CREATE TABLE bookings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      roomId BIGINT UNSIGNED NOT NULL,
      guestName VARCHAR(150) NOT NULL,
      guestEmail VARCHAR(190) NULL,
      guestPhone VARCHAR(30) NOT NULL,
      checkInDate DATE NOT NULL,
      checkOutDate DATE NOT NULL,
      adults TINYINT UNSIGNED NOT NULL DEFAULT 1,
      children TINYINT UNSIGNED NOT NULL DEFAULT 0,
      totalAmount DECIMAL(10,2) NOT NULL,
      paymentStatus ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
      bookingStatus ENUM('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
      specialRequests TEXT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxBookingsRoomDates (roomId, checkInDate, checkOutDate),
      INDEX idxBookingsStatus (bookingStatus, checkInDate),
      CONSTRAINT fkBookingsRoom FOREIGN KEY (roomId)
        REFERENCES rooms(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB`,
  ],
];

const realestate = () => [
  [
    "propertytypes",
    `CREATE TABLE propertytypes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqPropertyTypesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "properties",
    `CREATE TABLE properties (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      propertyTypeId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      listingType ENUM('sale','rent') NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      address VARCHAR(300) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NULL,
      zipCode VARCHAR(20) NULL,
      bedrooms TINYINT UNSIGNED NULL,
      bathrooms DECIMAL(3,1) NULL,
      area DECIMAL(10,2) NULL,
      areaUnit VARCHAR(20) NULL,
      yearBuilt SMALLINT UNSIGNED NULL,
      features JSON NULL,
      mainImageUrl VARCHAR(500) NULL,
      images JSON NULL,
      status ENUM('available','sold','rented','pending') NOT NULL DEFAULT 'available',
      featuredProperty TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxPropertiesTypeListingStatus (propertyTypeId, listingType, status),
      INDEX idxPropertiesCityStatus (city, status),
      CONSTRAINT fkPropertiesType FOREIGN KEY (propertyTypeId)
        REFERENCES propertytypes(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "agents",
    `CREATE TABLE agents (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      photoUrl VARCHAR(500) NULL,
      bio TEXT NULL,
      licenseNumber VARCHAR(100) NULL,
      specialization VARCHAR(150) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqAgentsEmail (email),
      INDEX idxAgentsStatus (status)
    ) ENGINE=InnoDB`,
  ],
];

const gym = () => [
  [
    "trainers",
    `CREATE TABLE trainers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(30) NULL,
      specialization VARCHAR(150) NULL,
      certification VARCHAR(255) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      photoUrl VARCHAR(500) NULL,
      bio TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxTrainersStatus (status)
    ) ENGINE=InnoDB`,
  ],
  [
    "membershipplans",
    `CREATE TABLE membershipplans (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      durationMonths TINYINT UNSIGNED NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      features JSON NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqMembershipPlansName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "members",
    `CREATE TABLE members (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      membershipNo VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(30) NOT NULL,
      dob DATE NULL,
      gender VARCHAR(30) NULL,
      planId BIGINT UNSIGNED NULL,
      joinDate DATE NOT NULL,
      expiryDate DATE NOT NULL,
      emergencyContact VARCHAR(150) NULL,
      emergencyPhone VARCHAR(30) NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','expired','suspended') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqMembersMembershipNo (membershipNo),
      INDEX idxMembersStatusExpiry (status, expiryDate),
      CONSTRAINT fkMembersPlan FOREIGN KEY (planId)
        REFERENCES membershipplans(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const blog = () => [
  [
    "blogcategories",
    `CREATE TABLE blogcategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(190) NOT NULL,
      description TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqBlogCategoriesSlug (slug)
    ) ENGINE=InnoDB`,
  ],
  [
    "blogposts",
    `CREATE TABLE blogposts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      authorId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      slug VARCHAR(190) NOT NULL,
      excerpt TEXT NULL,
      content LONGTEXT NOT NULL,
      featuredImageUrl VARCHAR(500) NULL,
      tags JSON NULL,
      viewCount INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
      publishedAt DATETIME NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqBlogPostsSlug (slug),
      INDEX idxBlogPostsCategoryStatus (categoryId, status, publishedAt),
      CONSTRAINT fkBlogPostsCategory FOREIGN KEY (categoryId)
        REFERENCES blogcategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "comments",
    `CREATE TABLE comments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      postId BIGINT UNSIGNED NOT NULL,
      authorName VARCHAR(150) NOT NULL,
      authorEmail VARCHAR(190) NOT NULL,
      content TEXT NOT NULL,
      status ENUM('pending','approved','spam') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCommentsPostStatus (postId, status, createdAt),
      CONSTRAINT fkCommentsPost FOREIGN KEY (postId)
        REFERENCES blogposts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`,
  ],
];

const portfolio = () => [
  [
    "projectcategories",
    `CREATE TABLE projectcategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqProjectCategoriesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "projects",
    `CREATE TABLE projects (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      clientName VARCHAR(150) NULL,
      projectUrl VARCHAR(500) NULL,
      thumbnailUrl VARCHAR(500) NULL,
      images JSON NULL,
      technologies JSON NULL,
      completedDate DATE NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxProjectsCategoryStatus (categoryId, status, sortOrder),
      CONSTRAINT fkProjectsCategory FOREIGN KEY (categoryId)
        REFERENCES projectcategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "testimonials",
    `CREATE TABLE testimonials (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      clientName VARCHAR(150) NOT NULL,
      clientCompany VARCHAR(150) NULL,
      clientPosition VARCHAR(100) NULL,
      content TEXT NOT NULL,
      rating TINYINT UNSIGNED NULL,
      photoUrl VARCHAR(500) NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxTestimonialsStatus (status, featured)
    ) ENGINE=InnoDB`,
  ],
];

const eventmanagement = () => [
  [
    "eventtypes",
    `CREATE TABLE eventtypes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqEventTypesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "events",
    `CREATE TABLE events (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      eventTypeId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      venue VARCHAR(255) NOT NULL,
      address TEXT NULL,
      startDateTime DATETIME NOT NULL,
      endDateTime DATETIME NOT NULL,
      capacity INT UNSIGNED NULL,
      ticketPrice DECIMAL(10,2) NULL,
      imageUrl VARCHAR(500) NULL,
      organizer VARCHAR(150) NULL,
      contactEmail VARCHAR(190) NULL,
      contactPhone VARCHAR(30) NULL,
      status ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
      featured TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxEventsTypeStatus (eventTypeId, status, startDateTime),
      CONSTRAINT fkEventsType FOREIGN KEY (eventTypeId)
        REFERENCES eventtypes(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "registrations",
    `CREATE TABLE registrations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      eventId BIGINT UNSIGNED NOT NULL,
      attendeeName VARCHAR(150) NOT NULL,
      attendeeEmail VARCHAR(190) NOT NULL,
      attendeePhone VARCHAR(30) NULL,
      ticketCount TINYINT UNSIGNED NOT NULL DEFAULT 1,
      totalAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      paymentStatus ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
      registrationStatus ENUM('confirmed','cancelled','attended') NOT NULL DEFAULT 'confirmed',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxRegistrationsEventStatus (eventId, registrationStatus),
      CONSTRAINT fkRegistrationsEvent FOREIGN KEY (eventId)
        REFERENCES events(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB`,
  ],
];

const ngo = () => [
  [
    "causes",
    `CREATE TABLE causes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(190) NOT NULL,
      description TEXT NOT NULL,
      goalAmount DECIMAL(12,2) NULL,
      raisedAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      imageUrl VARCHAR(500) NULL,
      startDate DATE NULL,
      endDate DATE NULL,
      status ENUM('active','completed','paused') NOT NULL DEFAULT 'active',
      featured TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCausesStatus (status, featured)
    ) ENGINE=InnoDB`,
  ],
  [
    "donations",
    `CREATE TABLE donations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      causeId BIGINT UNSIGNED NULL,
      donorName VARCHAR(150) NOT NULL,
      donorEmail VARCHAR(190) NULL,
      donorPhone VARCHAR(30) NULL,
      amount DECIMAL(10,2) NOT NULL,
      isAnonymous TINYINT(1) NOT NULL DEFAULT 0,
      paymentStatus ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
      transactionId VARCHAR(100) NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDonationsCauseStatus (causeId, paymentStatus, createdAt),
      CONSTRAINT fkDonationsCause FOREIGN KEY (causeId)
        REFERENCES causes(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "volunteers",
    `CREATE TABLE volunteers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      address TEXT NULL,
      skillsInterests TEXT NULL,
      availability VARCHAR(255) NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      joinedDate DATE NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqVolunteersEmail (email),
      INDEX idxVolunteersStatus (status)
    ) ENGINE=InnoDB`,
  ],
];

const spa = () => [
  [
    "servicecategories",
    `CREATE TABLE servicecategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqServiceCategoriesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "services",
    `CREATE TABLE services (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      description TEXT NULL,
      duration INT UNSIGNED NOT NULL COMMENT 'Duration in minutes',
      price DECIMAL(10,2) NOT NULL,
      imageUrl VARCHAR(500) NULL,
      benefits JSON NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxServicesCategoryStatus (categoryId, status),
      CONSTRAINT fkServicesCategory FOREIGN KEY (categoryId)
        REFERENCES servicecategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "appointments",
    `CREATE TABLE appointments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NOT NULL,
      therapistId BIGINT UNSIGNED NULL,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      appointmentDate DATE NOT NULL,
      appointmentTime TIME NOT NULL,
      specialRequests TEXT NULL,
      status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxAppointmentsServiceDateStatus (serviceId, appointmentDate, status),
      CONSTRAINT fkAppointmentsService FOREIGN KEY (serviceId)
        REFERENCES services(id) ON DELETE RESTRICT,
      CONSTRAINT fkAppointmentsTherapist FOREIGN KEY (therapistId)
        REFERENCES employees(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const lawfirm = () => [
  [
    "practiceareas",
    `CREATE TABLE practiceareas (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqPracticeAreasName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "attorneys",
    `CREATE TABLE attorneys (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(30) NULL,
      practiceAreaId BIGINT UNSIGNED NULL,
      barNumber VARCHAR(100) NULL,
      education VARCHAR(500) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      photoUrl VARCHAR(500) NULL,
      bio TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxAttorneysStatus (status),
      CONSTRAINT fkAttorneysPracticeArea FOREIGN KEY (practiceAreaId)
        REFERENCES practiceareas(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "caseinquiries",
    `CREATE TABLE caseinquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      practiceAreaId BIGINT UNSIGNED NULL,
      clientName VARCHAR(150) NOT NULL,
      clientEmail VARCHAR(190) NOT NULL,
      clientPhone VARCHAR(30) NULL,
      caseDetails TEXT NOT NULL,
      status ENUM('new','contacted','consultation','closed') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCaseInquiriesStatus (status, createdAt),
      CONSTRAINT fkCaseInquiriesPracticeArea FOREIGN KEY (practiceAreaId)
        REFERENCES practiceareas(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

module.exports = {
  common,
  generic: () => [],
  school,
  medical,
  ecommerce,
  restaurant,
  hotel,
  realestate,
  gym,
  blog,
  portfolio,
  eventmanagement,
  ngo,
  spa,
  lawfirm,
};
