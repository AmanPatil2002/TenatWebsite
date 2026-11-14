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
/* ------------------------------------------------------------------
   NEW PACKS — paste these above `module.exports` in pack.js.
   Same conventions as the existing packs: parent tables come first,
   camelCase columns, status ENUMs, createdAt/updatedAt, InnoDB.
   Table names are unique across every pack (and common), so nothing
   collides if a site ever loads more than one pack.
------------------------------------------------------------------ */

const marketing = () => [
  [
    "marketingservices",
    `CREATE TABLE marketingservices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      startingPrice DECIMAL(10,2) NULL,
      imageUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqMarketingServicesName (name),
      INDEX idxMarketingServicesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "casestudies",
    `CREATE TABLE casestudies (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      clientName VARCHAR(150) NULL,
      challenge TEXT NULL,
      solution TEXT NULL,
      results TEXT NULL,
      metrics JSON NULL,
      imageUrl VARCHAR(500) NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCaseStudiesServiceStatus (serviceId, status),
      INDEX idxCaseStudiesFeatured (status, featured),
      CONSTRAINT fkCaseStudiesService FOREIGN KEY (serviceId)
        REFERENCES marketingservices(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "leads",
    `CREATE TABLE leads (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NULL,
      company VARCHAR(150) NULL,
      websiteUrl VARCHAR(500) NULL,
      budgetRange VARCHAR(60) NULL,
      message TEXT NULL,
      status ENUM('new','contacted','qualified','won','lost') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxLeadsStatusDate (status, createdAt),
      CONSTRAINT fkLeadsService FOREIGN KEY (serviceId)
        REFERENCES marketingservices(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const salon = () => [
  [
    "salonservices",
    `CREATE TABLE salonservices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      serviceGroup VARCHAR(100) NULL COMMENT 'e.g. Hair, Skin, Nails, Makeup',
      description TEXT NULL,
      duration INT UNSIGNED NOT NULL COMMENT 'Duration in minutes',
      price DECIMAL(10,2) NOT NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxSalonServicesGroupStatus (serviceGroup, status)
    ) ENGINE=InnoDB`,
  ],
  [
    "stylists",
    `CREATE TABLE stylists (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      specialization VARCHAR(150) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxStylistsStatus (status)
    ) ENGINE=InnoDB`,
  ],
  [
    "salonbookings",
    `CREATE TABLE salonbookings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NOT NULL,
      stylistId BIGINT UNSIGNED NULL,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      bookingDate DATE NOT NULL,
      bookingTime TIME NOT NULL,
      notes TEXT NULL,
      status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxSalonBookingsDateStatus (bookingDate, status),
      INDEX idxSalonBookingsStylistDate (stylistId, bookingDate),
      CONSTRAINT fkSalonBookingsService FOREIGN KEY (serviceId)
        REFERENCES salonservices(id) ON DELETE RESTRICT,
      CONSTRAINT fkSalonBookingsStylist FOREIGN KEY (stylistId)
        REFERENCES stylists(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const news = () => [
  [
    "newscategories",
    `CREATE TABLE newscategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(190) NOT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqNewsCategoriesSlug (slug),
      INDEX idxNewsCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "articles",
    `CREATE TABLE articles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      slug VARCHAR(190) NOT NULL,
      summary TEXT NULL,
      content LONGTEXT NOT NULL,
      imageUrl VARCHAR(500) NULL,
      authorName VARCHAR(150) NULL,
      isBreaking TINYINT(1) NOT NULL DEFAULT 0,
      isFeatured TINYINT(1) NOT NULL DEFAULT 0,
      viewCount INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
      publishedAt DATETIME NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqArticlesSlug (slug),
      INDEX idxArticlesCategoryStatus (categoryId, status, publishedAt),
      INDEX idxArticlesFlags (status, isBreaking, isFeatured),
      CONSTRAINT fkArticlesCategory FOREIGN KEY (categoryId)
        REFERENCES newscategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "subscribers",
    `CREATE TABLE subscribers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NULL,
      email VARCHAR(190) NOT NULL,
      status ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqSubscribersEmail (email),
      INDEX idxSubscribersStatus (status)
    ) ENGINE=InnoDB`,
  ],
];

const finance = () => [
  [
    "financeproducts",
    `CREATE TABLE financeproducts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      productType ENUM('loan','deposit','investment','insurance','card','other') NOT NULL DEFAULT 'loan',
      description TEXT NULL,
      interestRate DECIMAL(5,2) NULL,
      minAmount DECIMAL(14,2) NULL,
      maxAmount DECIMAL(14,2) NULL,
      tenureMonths SMALLINT UNSIGNED NULL,
      features JSON NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxFinanceProductsTypeStatus (productType, status)
    ) ENGINE=InnoDB`,
  ],
  [
    "financeapplications",
    `CREATE TABLE financeapplications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      productId BIGINT UNSIGNED NOT NULL,
      applicantName VARCHAR(150) NOT NULL,
      applicantEmail VARCHAR(190) NULL,
      applicantPhone VARCHAR(30) NOT NULL,
      amountRequested DECIMAL(14,2) NULL,
      tenureMonths SMALLINT UNSIGNED NULL,
      purpose VARCHAR(255) NULL,
      message TEXT NULL,
      status ENUM('new','in_review','approved','rejected','closed') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxFinanceApplicationsStatus (status, createdAt),
      INDEX idxFinanceApplicationsProduct (productId, status),
      CONSTRAINT fkFinanceApplicationsProduct FOREIGN KEY (productId)
        REFERENCES financeproducts(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB`,
  ],
  [
    "branches",
    `CREATE TABLE branches (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      address VARCHAR(300) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NULL,
      zipCode VARCHAR(20) NULL,
      phone VARCHAR(30) NULL,
      email VARCHAR(190) NULL,
      workingHours VARCHAR(255) NULL,
      mapUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxBranchesCityStatus (city, status)
    ) ENGINE=InnoDB`,
  ],
];

const agriculture = () => [
  [
    "cropcategories",
    `CREATE TABLE cropcategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      imageUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqCropCategoriesName (name),
      INDEX idxCropCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "farmproducts",
    `CREATE TABLE farmproducts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      unit VARCHAR(30) NOT NULL DEFAULT 'kg',
      stockQuantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      isOrganic TINYINT(1) NOT NULL DEFAULT 0,
      harvestSeason VARCHAR(100) NULL,
      origin VARCHAR(150) NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxFarmProductsCategoryStatus (categoryId, status),
      CONSTRAINT fkFarmProductsCategory FOREIGN KEY (categoryId)
        REFERENCES cropcategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "farminquiries",
    `CREATE TABLE farminquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      productId BIGINT UNSIGNED NULL,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      quantity DECIMAL(10,2) NULL,
      deliveryAddress TEXT NULL,
      message TEXT NULL,
      status ENUM('new','contacted','confirmed','delivered','cancelled') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxFarmInquiriesStatus (status, createdAt),
      CONSTRAINT fkFarmInquiriesProduct FOREIGN KEY (productId)
        REFERENCES farmproducts(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const consulting = () => [
  [
    "consultingservices",
    `CREATE TABLE consultingservices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      deliverables JSON NULL,
      imageUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqConsultingServicesName (name),
      INDEX idxConsultingServicesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "consultants",
    `CREATE TABLE consultants (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      designation VARCHAR(150) NULL,
      expertise VARCHAR(255) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      linkedinUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxConsultantsStatus (status)
    ) ENGINE=InnoDB`,
  ],
  [
    "consultationrequests",
    `CREATE TABLE consultationrequests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NULL,
      consultantId BIGINT UNSIGNED NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NULL,
      company VARCHAR(150) NULL,
      preferredDate DATE NULL,
      message TEXT NULL,
      status ENUM('new','scheduled','completed','cancelled') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxConsultationRequestsStatus (status, createdAt),
      CONSTRAINT fkConsultationRequestsService FOREIGN KEY (serviceId)
        REFERENCES consultingservices(id) ON DELETE SET NULL,
      CONSTRAINT fkConsultationRequestsConsultant FOREIGN KEY (consultantId)
        REFERENCES consultants(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const petcare = () => [
  [
    "petservices",
    `CREATE TABLE petservices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      petType VARCHAR(60) NULL COMMENT 'e.g. Dog, Cat, Bird, All',
      description TEXT NULL,
      duration INT UNSIGNED NULL COMMENT 'Duration in minutes',
      price DECIMAL(10,2) NOT NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxPetServicesStatus (status, name)
    ) ENGINE=InnoDB`,
  ],
  [
    "veterinarians",
    `CREATE TABLE veterinarians (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      qualification VARCHAR(255) NULL,
      specialization VARCHAR(150) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxVeterinariansStatus (status)
    ) ENGINE=InnoDB`,
  ],
  [
    "petappointments",
    `CREATE TABLE petappointments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NOT NULL,
      veterinarianId BIGINT UNSIGNED NULL,
      ownerName VARCHAR(150) NOT NULL,
      ownerEmail VARCHAR(190) NULL,
      ownerPhone VARCHAR(30) NOT NULL,
      petName VARCHAR(100) NOT NULL,
      petType VARCHAR(60) NULL,
      petBreed VARCHAR(100) NULL,
      appointmentDate DATE NOT NULL,
      appointmentTime TIME NOT NULL,
      notes TEXT NULL,
      status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxPetAppointmentsDateStatus (appointmentDate, status),
      CONSTRAINT fkPetAppointmentsService FOREIGN KEY (serviceId)
        REFERENCES petservices(id) ON DELETE RESTRICT,
      CONSTRAINT fkPetAppointmentsVet FOREIGN KEY (veterinarianId)
        REFERENCES veterinarians(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const daycare = () => [
  [
    "daycareprograms",
    `CREATE TABLE daycareprograms (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      ageGroup VARCHAR(60) NOT NULL COMMENT 'e.g. 1-2 years, 3-5 years',
      description TEXT NULL,
      schedule VARCHAR(255) NULL,
      monthlyFee DECIMAL(10,2) NULL,
      capacity SMALLINT UNSIGNED NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDaycareProgramsStatus (status, ageGroup)
    ) ENGINE=InnoDB`,
  ],
  [
    "caregivers",
    `CREATE TABLE caregivers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      role VARCHAR(120) NULL,
      qualification VARCHAR(255) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCaregiversStatus (status)
    ) ENGINE=InnoDB`,
  ],
  [
    "admissionenquiries",
    `CREATE TABLE admissionenquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      programId BIGINT UNSIGNED NULL,
      parentName VARCHAR(150) NOT NULL,
      parentEmail VARCHAR(190) NULL,
      parentPhone VARCHAR(30) NOT NULL,
      childName VARCHAR(150) NOT NULL,
      childDob DATE NULL,
      message TEXT NULL,
      status ENUM('new','contacted','visit_scheduled','enrolled','closed') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxAdmissionEnquiriesStatus (status, createdAt),
      CONSTRAINT fkAdmissionEnquiriesProgram FOREIGN KEY (programId)
        REFERENCES daycareprograms(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const dental = () => [
  [
    "dentalservices",
    `CREATE TABLE dentalservices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      duration INT UNSIGNED NULL COMMENT 'Duration in minutes',
      priceFrom DECIMAL(10,2) NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqDentalServicesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "dentists",
    `CREATE TABLE dentists (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      qualification VARCHAR(255) NULL,
      specialization VARCHAR(150) NULL,
      experienceYears TINYINT UNSIGNED NULL,
      consultationFee DECIMAL(10,2) NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDentistsStatus (status)
    ) ENGINE=InnoDB`,
  ],
  [
    "dentalappointments",
    `CREATE TABLE dentalappointments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NULL,
      dentistId BIGINT UNSIGNED NULL,
      patientName VARCHAR(150) NOT NULL,
      patientEmail VARCHAR(190) NULL,
      patientPhone VARCHAR(30) NOT NULL,
      appointmentDate DATE NOT NULL,
      appointmentTime TIME NOT NULL,
      symptoms TEXT NULL,
      status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDentalAppointmentsDateStatus (appointmentDate, status),
      INDEX idxDentalAppointmentsDentistDate (dentistId, appointmentDate),
      CONSTRAINT fkDentalAppointmentsService FOREIGN KEY (serviceId)
        REFERENCES dentalservices(id) ON DELETE SET NULL,
      CONSTRAINT fkDentalAppointmentsDentist FOREIGN KEY (dentistId)
        REFERENCES dentists(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];
/* ------------------------------------------------------------------
   ADDITIONAL PACKS — for categories currently mapped to "generic"
   or mis-mapped to another pack. All table names are unique.
------------------------------------------------------------------ */

const mobileapps = () => [
  [
    "appcategories",
    `CREATE TABLE appcategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      iconUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqAppCategoriesName (name),
      INDEX idxAppCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "mobileapps",
    `CREATE TABLE mobileapps (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      tagline VARCHAR(255) NULL,
      description TEXT NULL,
      platform ENUM('android','ios','both') NOT NULL DEFAULT 'both',
      version VARCHAR(40) NULL,
      sizeMb DECIMAL(8,2) NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      isFree TINYINT(1) NOT NULL DEFAULT 1,
      iconUrl VARCHAR(500) NULL,
      bannerUrl VARCHAR(500) NULL,
      screenshots JSON NULL,
      storeUrlAndroid VARCHAR(500) NULL,
      storeUrlIos VARCHAR(500) NULL,
      downloadCount INT UNSIGNED NOT NULL DEFAULT 0,
      rating DECIMAL(3,2) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxMobileAppsCategoryStatus (categoryId, status),
      INDEX idxMobileAppsPlatform (platform, status),
      CONSTRAINT fkMobileAppsCategory FOREIGN KEY (categoryId)
        REFERENCES appcategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "appreviews",
    `CREATE TABLE appreviews (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      appId BIGINT UNSIGNED NOT NULL,
      reviewerName VARCHAR(150) NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      comment TEXT NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxAppReviewsAppStatus (appId, status, createdAt),
      CONSTRAINT fkAppReviewsApp FOREIGN KEY (appId)
        REFERENCES mobileapps(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`,
  ],
];

const interiordesign = () => [
  [
    "designservices",
    `CREATE TABLE designservices (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      startingPrice DECIMAL(10,2) NULL,
      imageUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqDesignServicesName (name),
      INDEX idxDesignServicesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "designprojects",
    `CREATE TABLE designprojects (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      clientName VARCHAR(150) NULL,
      location VARCHAR(255) NULL,
      style VARCHAR(100) NULL,
      budget DECIMAL(12,2) NULL,
      completionDate DATE NULL,
      thumbnailUrl VARCHAR(500) NULL,
      images JSON NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDesignProjectsServiceStatus (serviceId, status, sortOrder),
      CONSTRAINT fkDesignProjectsService FOREIGN KEY (serviceId)
        REFERENCES designservices(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "designinquiries",
    `CREATE TABLE designinquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      serviceId BIGINT UNSIGNED NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NULL,
      projectType VARCHAR(120) NULL,
      location VARCHAR(255) NULL,
      budgetRange VARCHAR(60) NULL,
      message TEXT NULL,
      status ENUM('new','contacted','quoted','won','lost') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDesignInquiriesStatus (status, createdAt),
      CONSTRAINT fkDesignInquiriesService FOREIGN KEY (serviceId)
        REFERENCES designservices(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const music = () => [
  [
    "artists",
    `CREATE TABLE artists (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      genre VARCHAR(100) NULL,
      bio TEXT NULL,
      photoUrl VARCHAR(500) NULL,
      country VARCHAR(100) NULL,
      websiteUrl VARCHAR(500) NULL,
      spotifyUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxArtistsStatusGenre (status, genre)
    ) ENGINE=InnoDB`,
  ],
  [
    "albums",
    `CREATE TABLE albums (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      artistId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      releaseDate DATE NULL,
      coverUrl VARCHAR(500) NULL,
      trackCount SMALLINT UNSIGNED NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxAlbumsArtistStatus (artistId, status),
      CONSTRAINT fkAlbumsArtist FOREIGN KEY (artistId)
        REFERENCES artists(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "tracks",
    `CREATE TABLE tracks (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      albumId BIGINT UNSIGNED NULL,
      artistId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      duration INT UNSIGNED NULL COMMENT 'Duration in seconds',
      audioUrl VARCHAR(500) NULL,
      lyrics TEXT NULL,
      isExplicit TINYINT(1) NOT NULL DEFAULT 0,
      playCount INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxTracksAlbumStatus (albumId, status),
      INDEX idxTracksArtistStatus (artistId, status),
      CONSTRAINT fkTracksAlbum FOREIGN KEY (albumId)
        REFERENCES albums(id) ON DELETE SET NULL,
      CONSTRAINT fkTracksArtist FOREIGN KEY (artistId)
        REFERENCES artists(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "eventshows",
    `CREATE TABLE eventshows (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      artistId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      venue VARCHAR(255) NOT NULL,
      city VARCHAR(100) NULL,
      showDateTime DATETIME NOT NULL,
      ticketUrl VARCHAR(500) NULL,
      priceFrom DECIMAL(10,2) NULL,
      imageUrl VARCHAR(500) NULL,
      status ENUM('upcoming','sold_out','completed','cancelled') NOT NULL DEFAULT 'upcoming',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxEventShowsArtistDate (artistId, showDateTime),
      INDEX idxEventShowsStatusDate (status, showDateTime),
      CONSTRAINT fkEventShowsArtist FOREIGN KEY (artistId)
        REFERENCES artists(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const streaming = () => [
  [
    "genres",
    `CREATE TABLE genres (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqGenresName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "movies",
    `CREATE TABLE movies (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      genreId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      synopsis TEXT NULL,
      releaseYear SMALLINT UNSIGNED NULL,
      duration INT UNSIGNED NULL COMMENT 'Duration in minutes',
      language VARCHAR(60) NULL,
      director VARCHAR(150) NULL,
      castList JSON NULL,
      posterUrl VARCHAR(500) NULL,
      bannerUrl VARCHAR(500) NULL,
      trailerUrl VARCHAR(500) NULL,
      streamUrl VARCHAR(500) NULL,
      rating DECIMAL(3,1) NULL,
      ageRating VARCHAR(20) NULL,
      status ENUM('active','inactive','coming_soon') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxMoviesGenreStatus (genreId, status),
      INDEX idxMoviesReleaseYear (status, releaseYear),
      CONSTRAINT fkMoviesGenre FOREIGN KEY (genreId)
        REFERENCES genres(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "subscriptionplans",
    `CREATE TABLE subscriptionplans (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NOT NULL,
      billingPeriod ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
      maxStreams TINYINT UNSIGNED NOT NULL DEFAULT 1,
      videoQuality VARCHAR(20) NULL COMMENT 'e.g. SD, HD, 4K',
      features JSON NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqSubscriptionPlansName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "watchlist",
    `CREATE TABLE watchlist (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      movieId BIGINT UNSIGNED NOT NULL,
      userEmail VARCHAR(190) NOT NULL,
      addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uqWatchlistMovieUser (movieId, userEmail),
      CONSTRAINT fkWatchlistMovie FOREIGN KEY (movieId)
        REFERENCES movies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`,
  ],
];

const gaming = () => [
  [
    "gamecategories",
    `CREATE TABLE gamecategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      iconUrl VARCHAR(500) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqGameCategoriesName (name)
    ) ENGINE=InnoDB`,
  ],
  [
    "games",
    `CREATE TABLE games (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      platform ENUM('pc','playstation','xbox','nintendo','mobile','cross_platform') NOT NULL DEFAULT 'pc',
      genre VARCHAR(100) NULL,
      releaseDate DATE NULL,
      coverUrl VARCHAR(500) NULL,
      screenshots JSON NULL,
      trailerUrl VARCHAR(500) NULL,
      rating DECIMAL(3,1) NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      isFree TINYINT(1) NOT NULL DEFAULT 0,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active','inactive','coming_soon') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxGamesCategoryStatus (categoryId, status),
      INDEX idxGamesPlatformStatus (platform, status),
      CONSTRAINT fkGamesCategory FOREIGN KEY (categoryId)
        REFERENCES gamecategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "teams",
    `CREATE TABLE teams (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      gameId BIGINT UNSIGNED NULL,
      logoUrl VARCHAR(500) NULL,
      region VARCHAR(100) NULL,
      captainName VARCHAR(150) NULL,
      foundedYear SMALLINT UNSIGNED NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxTeamsGameStatus (gameId, status),
      CONSTRAINT fkTeamsGame FOREIGN KEY (gameId)
        REFERENCES games(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "tournaments",
    `CREATE TABLE tournaments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      gameId BIGINT UNSIGNED NULL,
      title VARCHAR(190) NOT NULL,
      description TEXT NULL,
      format VARCHAR(100) NULL,
      prizePool DECIMAL(12,2) NULL,
      startDate DATE NOT NULL,
      endDate DATE NULL,
      registrationUrl VARCHAR(500) NULL,
      bannerUrl VARCHAR(500) NULL,
      maxTeams SMALLINT UNSIGNED NULL,
      status ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxTournamentsGameStatus (gameId, status, startDate),
      CONSTRAINT fkTournamentsGame FOREIGN KEY (gameId)
        REFERENCES games(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const jewelry = () => [
  [
    "jewelrycategories",
    `CREATE TABLE jewelrycategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      imageUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqJewelryCategoriesName (name),
      INDEX idxJewelryCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "jewelryproducts",
    `CREATE TABLE jewelryproducts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      sku VARCHAR(100) NULL,
      description TEXT NULL,
      material VARCHAR(100) NULL COMMENT 'e.g. Gold, Silver, Platinum',
      gemstone VARCHAR(100) NULL,
      weightGrams DECIMAL(8,3) NULL,
      purity VARCHAR(50) NULL COMMENT 'e.g. 18K, 22K, 925',
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      salePrice DECIMAL(12,2) NULL,
      stock INT UNSIGNED NOT NULL DEFAULT 0,
      thumbnailUrl VARCHAR(500) NULL,
      images JSON NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqJewelryProductsSku (sku),
      INDEX idxJewelryProductsCategoryStatus (categoryId, status),
      CONSTRAINT fkJewelryProductsCategory FOREIGN KEY (categoryId)
        REFERENCES jewelrycategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "jewelryinquiries",
    `CREATE TABLE jewelryinquiries (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      productId BIGINT UNSIGNED NULL,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      inquiryType ENUM('general','custom_design','price','availability','repair') NOT NULL DEFAULT 'general',
      message TEXT NULL,
      status ENUM('new','contacted','quoted','closed') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxJewelryInquiriesStatus (status, createdAt),
      CONSTRAINT fkJewelryInquiriesProduct FOREIGN KEY (productId)
        REFERENCES jewelryproducts(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const furniture = () => [
  [
    "furniturecategories",
    `CREATE TABLE furniturecategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      roomType VARCHAR(100) NULL COMMENT 'e.g. Living Room, Bedroom, Office',
      imageUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqFurnitureCategoriesName (name),
      INDEX idxFurnitureCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "furnitureproducts",
    `CREATE TABLE furnitureproducts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      sku VARCHAR(100) NULL,
      description TEXT NULL,
      material VARCHAR(150) NULL,
      color VARCHAR(100) NULL,
      dimensions VARCHAR(100) NULL COMMENT 'e.g. 200x90x80 cm',
      weightKg DECIMAL(8,2) NULL,
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      salePrice DECIMAL(12,2) NULL,
      stock INT UNSIGNED NOT NULL DEFAULT 0,
      thumbnailUrl VARCHAR(500) NULL,
      images JSON NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqFurnitureProductsSku (sku),
      INDEX idxFurnitureProductsCategoryStatus (categoryId, status),
      CONSTRAINT fkFurnitureProductsCategory FOREIGN KEY (categoryId)
        REFERENCES furniturecategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "customorders",
    `CREATE TABLE customorders (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      productId BIGINT UNSIGNED NULL,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      requirements TEXT NOT NULL,
      dimensions VARCHAR(100) NULL,
      preferredMaterial VARCHAR(150) NULL,
      budget DECIMAL(12,2) NULL,
      status ENUM('new','designing','quoted','confirmed','completed','cancelled') NOT NULL DEFAULT 'new',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCustomOrdersStatus (status, createdAt),
      CONSTRAINT fkCustomOrdersProduct FOREIGN KEY (productId)
        REFERENCES furnitureproducts(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
];

const grocery = () => [
  [
    "grocerycategories",
    `CREATE TABLE grocerycategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      iconUrl VARCHAR(500) NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqGroceryCategoriesName (name),
      INDEX idxGroceryCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "groceryproducts",
    `CREATE TABLE groceryproducts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      sku VARCHAR(100) NULL,
      description TEXT NULL,
      brand VARCHAR(150) NULL,
      unit VARCHAR(30) NOT NULL DEFAULT 'pcs' COMMENT 'e.g. kg, g, L, ml, pcs',
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      salePrice DECIMAL(10,2) NULL,
      stockQuantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      isOrganic TINYINT(1) NOT NULL DEFAULT 0,
      expiryDate DATE NULL,
      thumbnailUrl VARCHAR(500) NULL,
      images JSON NULL,
      status ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqGroceryProductsSku (sku),
      INDEX idxGroceryProductsCategoryStatus (categoryId, status),
      CONSTRAINT fkGroceryProductsCategory FOREIGN KEY (categoryId)
        REFERENCES grocerycategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "deliveryslots",
    `CREATE TABLE deliveryslots (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slotLabel VARCHAR(100) NOT NULL COMMENT 'e.g. 9AM-12PM',
      startTime TIME NOT NULL,
      endTime TIME NOT NULL,
      maxOrders SMALLINT UNSIGNED NOT NULL DEFAULT 50,
      daysOfWeek VARCHAR(100) NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxDeliverySlotsStatus (status, startTime)
    ) ENGINE=InnoDB`,
  ],
];

const cafe = () => [
  [
    "cafecategories",
    `CREATE TABLE cafecategories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      sortOrder INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uqCafeCategoriesName (name),
      INDEX idxCafeCategoriesOrder (status, sortOrder)
    ) ENGINE=InnoDB`,
  ],
  [
    "cafeitems",
    `CREATE TABLE cafeitems (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoryId BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      sizeOptions JSON NULL COMMENT 'e.g. Small, Medium, Large with prices',
      imageUrl VARCHAR(500) NULL,
      isVeg TINYINT(1) NOT NULL DEFAULT 0,
      isSignature TINYINT(1) NOT NULL DEFAULT 0,
      calories SMALLINT UNSIGNED NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxCafeItemsCategoryStatus (categoryId, status),
      CONSTRAINT fkCafeItemsCategory FOREIGN KEY (categoryId)
        REFERENCES cafecategories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`,
  ],
  [
    "tablebookings",
    `CREATE TABLE tablebookings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customerName VARCHAR(150) NOT NULL,
      customerEmail VARCHAR(190) NULL,
      customerPhone VARCHAR(30) NOT NULL,
      bookingDate DATE NOT NULL,
      bookingTime TIME NOT NULL,
      partySize TINYINT UNSIGNED NOT NULL,
      seatingPreference ENUM('indoor','outdoor','window','any') NOT NULL DEFAULT 'any',
      specialRequests TEXT NULL,
      status ENUM('pending','confirmed','seated','cancelled','no_show') NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idxTableBookingsDateStatus (bookingDate, status)
    ) ENGINE=InnoDB`,
  ],
];

module.exports = {
  common, school, medical, ecommerce, restaurant, hotel, realestate, gym,
  blog, portfolio, eventmanagement, ngo, spa, lawfirm,
  marketing, salon, news, finance, agriculture, consulting, petcare, daycare, dental,
  mobileapps, interiordesign, music, streaming, gaming,
  jewelry, furniture, grocery, cafe,
};
