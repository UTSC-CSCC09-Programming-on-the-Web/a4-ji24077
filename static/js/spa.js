"use strict";

(function () {
  // State management
  const [currentPageKey, getCurrentPage, setCurrentPage] = meact.useState(0);
  const [selectedImageKey, getSelectedImage, setSelectedImage] = meact.useState(null);
  const [currentCommentPageKey, getCurrentCommentPage, setCurrentCommentPage] = meact.useState(0);
  const [currentUserKey, getCurrentUser, setCurrentUser] = meact.useState(null);
  const [currentRouteKey, getCurrentRoute, setCurrentRoute] = meact.useState("gallery-list");
  const [galleryUserIdKey, getGalleryUserId, setGalleryUserId] = meact.useState(null);
  const USERS_PER_PAGE = 10;
  const IMAGES_PER_PAGE = 10;
  const COMMENTS_PER_PAGE = 10;

  // DOM Elements
  const elements = {
    // Page elements
    pages: {
      "gallery-list": document.getElementById("gallery-list-page"),
      login: document.getElementById("login-page"),
      signup: document.getElementById("signup-page"),
      gallery: document.getElementById("gallery-page"),
      credits: document.getElementById("credits-page"),
    },

    // Gallery list page
    galleryList: document.getElementById("gallery-list"),
    paginationControls: document.getElementById("pagination-controls"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    imageDetail: document.getElementById("image-detail"),

    // Gallery page
    galleryTitle: document.getElementById("galleryTitle"),
    galleryOwner: document.getElementById("galleryOwner"),
    backToGalleries: document.getElementById("backToGalleries"),
    toggleAddFormGallery: document.querySelector("#toggleAddFormGallery"),
    addImageFormGallery: document.querySelector("#addImageFormGallery"),
    imageTitleGallery: document.querySelector("#imageTitleGallery"),
    imageDescriptionGallery: document.querySelector("#imageDescriptionGallery"),
    imageFileGallery: document.querySelector("#imageFileGallery"),
    imageList: document.getElementById("image-list"),
    paginationControlsGallery: document.getElementById("pagination-controls-gallery"),
    prevPageGallery: document.getElementById("prevPageGallery"),
    nextPageGallery: document.getElementById("nextPageGallery"),
    imageDetailGallery: document.getElementById("image-detail-gallery"),

    // Auth
    loginBtn: document.getElementById("loginBtn"),
    signupBtn: document.getElementById("signupBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    userInfo: document.getElementById("userInfo"),
    username: document.getElementById("username"),

    // Loading
    loading: document.getElementById("loading"),
  };

  // Router initialization
  function initRouter() {
    // Listen for URL hash changes
    window.addEventListener("hashchange", handleRouteChange);

    // Set initial route
    if (!window.location.hash) {
      window.location.hash = "#gallery-list";
    } else {
      handleRouteChange();
    }
  }

  // Handle route changes
  function handleRouteChange() {
    const hash = window.location.hash.slice(1);
    const route = hash.split("?")[0];
    const params = new URLSearchParams(hash.split("?")[1] || "");

    navigateTo(route, params);
  }

  // Page navigation
  function navigateTo(route, params = new URLSearchParams()) {
    // Close image detail view on every route change
    closeImageDetail();
    // Hide current page
    const currentPage = elements.pages[getCurrentRoute()];
    if (currentPage) {
      currentPage.classList.remove("active");
    }

    // Show new page
    const newPage = elements.pages[route];
    if (newPage) {
      newPage.classList.add("active");
      setCurrentRoute(route);

      // Per-page initialization
      switch (route) {
        case "gallery-list":
          initGalleryListPage();
          break;
        case "login":
          initLoginPage();
          break;
        case "signup":
          initSignupPage();
          break;
        case "gallery":
          const userId = params.get("userId");
          if (userId) {
            setGalleryUserId(userId);
            initGalleryPage(userId);
          }
          break;
        case "credits":
          // Credits page is static content
          break;
      }
    }
  }

  // Initialize gallery list page
  function initGalleryListPage() {
    setCurrentPage(0);
    setSelectedImage(null);
    renderGalleryList();
    setupGalleryListEvents();
  }

  // Initialize login page
  function initLoginPage() {
    // Reset form
    document.getElementById("loginForm").reset();
  }

  // Initialize signup page
  function initSignupPage() {
    // Reset form
    document.getElementById("signupForm").reset();
  }

  // Initialize gallery page
  function initGalleryPage(userId) {
    setCurrentPage(0);
    setSelectedImage(null);
    renderGalleryHeader(userId);
    renderImageList(userId);
    setupGalleryPageEvents(userId);

    // Show/hide Add Image button based on permission
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.userId === userId) {
      // Show Add Image button only for own gallery
      elements.toggleAddFormGallery.classList.remove("hidden");
    } else {
      // Hide Add Image button for other users' galleries
      elements.toggleAddFormGallery.classList.add("hidden");
    }
  }

  // Render gallery header
  function renderGalleryHeader(userId) {
    apiService
      .getUser(userId)
      .then((data) => {
        const user = data.user; // Extract user object from API response
        if (user && user.username) {
          elements.galleryTitle.textContent = `${user.username}'s Gallery`;
          elements.galleryOwner.textContent = `Owner: ${user.username}`;
        } else {
          elements.galleryTitle.textContent = "Gallery Not Found";
          elements.galleryOwner.textContent = "User not found";
        }
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        elements.galleryTitle.textContent = "Gallery Not Found";
        elements.galleryOwner.textContent = "User not found";
      });
  }

  // Render gallery list
  function renderGalleryList() {
    showLoading();
    const offset = getCurrentPage() * USERS_PER_PAGE;

    apiService
      .getUsers(offset, USERS_PER_PAGE)
      .then((data) => {
        console.log("[DEBUG] Galleries fetched successfully:", data.users.length, "galleries");
        const { users, total } = data;
        elements.galleryList.innerHTML = "";

        if (total === 0) {
          elements.galleryList.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 2rem auto; max-width: 500px;">
              <p style="color: #666; font-size: 1.3rem; margin-bottom: 1rem;">No galleries available</p>
              <p style="color: #888; font-size: 1rem; margin-bottom: 1.5rem;">Be the first to create a gallery!</p>
            </div>
          `;
          elements.paginationControls.style.display = "none";
          hideLoading();
          return;
        }

        const currentUser = getCurrentUser();
        let sortedUsers = [...users];

        // If logged in, pin own gallery to top
        if (currentUser) {
          const ownGallery = sortedUsers.find((user) => user.userId === currentUser.userId);
          if (ownGallery) {
            sortedUsers = sortedUsers.filter((user) => user.userId !== currentUser.userId);
            sortedUsers.unshift(ownGallery);
          }
        }

        sortedUsers.forEach((user, index) => {
          const card = document.createElement("div");
          card.className = "gallery-card";

          const previewImage = user.latestImage
            ? `<img src="${user.latestImage.url}" alt="${user.latestImage.title}" class="gallery-preview">`
            : `<div class="gallery-preview" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #888;">No Images</div>`;

          const isOwnGallery = currentUser && currentUser.userId === user.userId;
          const ownGalleryBadge = isOwnGallery
            ? '<div class="own-gallery-badge">My Gallery</div>'
            : "";

          card.innerHTML = `
            ${previewImage}
            <div class="gallery-info">
              <h3 class="gallery-title">${user.username}'s Gallery</h3>
              ${ownGalleryBadge}
              <p class="gallery-owner">Owner: ${user.username}</p>
              <div class="gallery-stats">
                <span>${user.imageCount || 0} images</span>
              </div>
            </div>
          `;

          card.onclick = () => {
            console.log("[DEBUG] Gallery clicked:", user.userId);
            navigateTo("gallery", new URLSearchParams({ userId: user.userId }));
          };

          elements.galleryList.appendChild(card);
        });

        elements.paginationControls.style.display = "flex";
        elements.prevPage.disabled = getCurrentPage() === 0;
        elements.nextPage.disabled = offset + USERS_PER_PAGE >= total;
        hideLoading();
      })
      .catch((error) => {
        console.error("[ERROR] Failed to fetch galleries:", error);
        elements.galleryList.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 2rem auto; max-width: 500px;">
            <p style="color: #dc3545; font-size: 1.3rem; margin-bottom: 1rem;">Failed to load galleries</p>
            <p style="color: #721c24; font-size: 1rem; margin-bottom: 1.5rem;">Please try refreshing the page.</p>
            <button class="btn primary" onclick="location.reload()">Refresh Page</button>
          </div>
        `;
        elements.paginationControls.style.display = "none";
        hideLoading();
      });
  }

  // 이미지 목록 렌더링
  function renderImageList(userId) {
    showLoading();
    const offset = getCurrentPage() * IMAGES_PER_PAGE;

    apiService
      .getUserGallery(userId, offset, IMAGES_PER_PAGE)
      .then((data) => {
        console.log("[DEBUG] Images fetched successfully:", data.images.length, "images");
        const { images, total } = data;
        elements.imageList.innerHTML = "";

        if (total === 0) {
          elements.imageList.innerHTML = `
            <div class="no-images" style="text-align: center; padding: 3rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 2rem auto; max-width: 500px;">
              <p style="color: #666; font-size: 1.3rem; margin-bottom: 1rem;">No images in this gallery</p>
              <p style="color: #888; font-size: 1rem; margin-bottom: 1.5rem;">This gallery is empty.</p>
            </div>
          `;
          elements.paginationControlsGallery.style.display = "none";
          hideLoading();
          return;
        }

        images.forEach((image) => {
          const card = document.createElement("div");
          card.className = "image-card";
          card.innerHTML = `
            <img src="${image.url}" alt="${image.title}" class="image-thumbnail">
            <div class="image-info">
              <h3 class="image-title">${image.title}</h3>
              <p class="image-date">${new Date(image.date).toLocaleDateString()}</p>
            </div>
          `;

          card.onclick = () => {
            console.log("[DEBUG] Image clicked:", image.imageId);
            setSelectedImage(image);
            setCurrentCommentPage(0);
            renderImageDetail(image, userId);
          };

          elements.imageList.appendChild(card);
        });

        elements.paginationControlsGallery.style.display = "flex";
        elements.prevPageGallery.disabled = getCurrentPage() === 0;
        elements.nextPageGallery.disabled = offset + IMAGES_PER_PAGE >= total;
        hideLoading();
      })
      .catch((error) => {
        console.error("[ERROR] Failed to fetch images:", error);
        elements.imageList.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 2rem auto; max-width: 500px;">
            <p style="color: #dc3545; font-size: 1.3rem; margin-bottom: 1rem;">Failed to load images</p>
            <p style="color: #721c24; font-size: 1rem; margin-bottom: 1.5rem;">Please try refreshing the page.</p>
            <button class="btn primary" onclick="location.reload()">Refresh Page</button>
          </div>
        `;
        elements.paginationControlsGallery.style.display = "none";
        hideLoading();
      });
  }

  // 갤러리 목록 페이지 이벤트 설정
  function setupGalleryListEvents() {
    // 페이지네이션
    elements.prevPage.onclick = () => {
      if (getCurrentPage() > 0) {
        setCurrentPage(getCurrentPage() - 1);
        renderGalleryList();
      }
    };

    elements.nextPage.onclick = () => {
      setCurrentPage(getCurrentPage() + 1);
      renderGalleryList();
    };

    // 갤러리 목록 페이지에서는 Add Image 기능 제거 (README 조건)
  }

  // 갤러리 페이지 이벤트 설정
  function setupGalleryPageEvents(userId) {
    // 뒤로 가기
    elements.backToGalleries.onclick = () => {
      navigateTo("gallery-list");
    };

    // 페이지네이션
    elements.prevPageGallery.onclick = () => {
      if (getCurrentPage() > 0) {
        setCurrentPage(getCurrentPage() - 1);
        renderImageList(userId);
      }
    };

    elements.nextPageGallery.onclick = () => {
      setCurrentPage(getCurrentPage() + 1);
      renderImageList(userId);
    };

    // 이미지 추가 폼 토글
    elements.toggleAddFormGallery.onclick = () => {
      elements.addImageFormGallery.classList.toggle("hidden");
    };

    // 이미지 추가
    elements.addImageFormGallery.onsubmit = (e) => {
      e.preventDefault();
      addImage(userId);
    };
  }

  // 인증 관련 함수들
  function updateAuthUI(isLoggedIn) {
    if (isLoggedIn) {
      elements.loginBtn.classList.add("hidden");
      elements.signupBtn.classList.add("hidden");
      elements.logoutBtn.classList.remove("hidden");
      elements.userInfo.classList.remove("hidden");
      elements.toggleAddFormGallery.classList.add("hidden");
    } else {
      elements.loginBtn.classList.remove("hidden");
      elements.signupBtn.classList.remove("hidden");
      elements.logoutBtn.classList.add("hidden");
      elements.userInfo.classList.add("hidden");
      elements.toggleAddFormGallery.classList.add("hidden");
    }
  }

  function checkAuthStatus() {
    apiService
      .getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        elements.username.textContent = user.username;
        updateAuthUI(true);
      })
      .catch(() => {
        setCurrentUser(null);
        updateAuthUI(false);
      });
  }

  // 로딩 표시/숨김
  function showLoading() {
    elements.loading.style.display = "block";
  }

  function hideLoading() {
    elements.loading.style.display = "none";
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 인증 버튼들
    elements.loginBtn.onclick = () => navigateTo("login");
    elements.signupBtn.onclick = () => navigateTo("signup");
    elements.logoutBtn.onclick = handleLogout;

    // 네비게이션 링크들
    document.getElementById("goToSignup").onclick = (e) => {
      e.preventDefault();
      navigateTo("signup");
    };
    document.getElementById("goToLogin").onclick = (e) => {
      e.preventDefault();
      navigateTo("login");
    };
    document.getElementById("goToHome").onclick = (e) => {
      e.preventDefault();
      navigateTo("gallery-list");
    };
    document.getElementById("goToHomeFromSignup").onclick = (e) => {
      e.preventDefault();
      navigateTo("gallery-list");
    };
    document.getElementById("goToCredits").onclick = (e) => {
      e.preventDefault();
      navigateTo("credits");
    };

    // 로그인 폼
    document.getElementById("loginForm").onsubmit = (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;

      apiService
        .login(username, password)
        .then(() => {
          checkAuthStatus();
          navigateTo("gallery-list");
          console.log("Login successful!");
        })
        .catch((error) => {
          console.error("Login error:", error);
          console.log("Login failed: " + error.message);
        });
    };

    // 회원가입 폼
    document.getElementById("signupForm").onsubmit = (e) => {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById("signupConfirmPassword").value;

      if (password !== confirmPassword) {
        console.log("Passwords do not match");
        return;
      }

      apiService
        .signup(username, email, password)
        .then(() => {
          console.log("Signup successful! Please login.");
          navigateTo("login");
        })
        .catch((error) => {
          console.error("Signup error:", error);
          console.log("Signup failed: " + error.message);
        });
    };
  }

  // 로그아웃 처리
  function handleLogout() {
    apiService
      .logout()
      .then(() => {
        // Clear browser cookies explicitly
        document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;";
        document.cookie =
          "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=127.0.0.1;";

        setCurrentUser(null);
        updateAuthUI(false);
        console.log("Logged out successfully!");
        navigateTo("gallery-list");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
        console.log("Failed to logout");
      });
  }

  // 이미지 상세보기 렌더링
  function renderImageDetail(image, userId) {
    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.userId === userId;
    const isImageOwner = currentUser && currentUser.userId === image.userId;

    // Format date in en-US
    const uploadDate = new Date(image.date);
    const formattedDate = uploadDate.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    elements.imageDetailGallery.innerHTML = `
      <div class="image-detail-container">
        <div class="image-detail-header">
          <h2>${image.title}</h2>
          <div class="image-detail-actions">
            ${isImageOwner ? `<button class="btn danger" onclick="deleteImage('${image.imageId}', '${userId}')">Delete Image</button>` : ""}
            <button class="btn close-btn" onclick="closeImageDetail()">×</button>
          </div>
        </div>
        <div class="image-detail-content">
          <img src="${image.url}" alt="${image.title}" class="image-detail-img">
          <div class="image-detail-info">
            <p><strong>Uploaded:</strong> ${formattedDate}</p>
            <p><strong>By:</strong> ${image.author}</p>
            ${image.description ? `<p><strong>Description:</strong> ${image.description}</p>` : ""}
          </div>
        </div>
        <div class="comments-section">
          <h3>Comments</h3>
          ${
            currentUser
              ? `
            <form id="commentForm" class="comment-form">
              <div class="form-group">
                <textarea id="commentContent" placeholder="Write a comment..." required></textarea>
              </div>
              <button type="submit" class="btn primary">Add Comment</button>
            </form>
            <div id="commentsList" class="comments-list"></div>
            <div id="commentsPagination" class="pagination-controls">
              <button id="prevCommentPage" class="btn">Prev</button>
              <button id="nextCommentPage" class="btn">Next</button>
            </div>
          `
              : '<p class="login-prompt">Please login to view and add comments.</p>'
          }
        </div>
      </div>
    `;

    elements.imageDetailGallery.classList.remove("hidden");

    // Comment form event
    if (currentUser) {
      document.getElementById("commentForm").onsubmit = (e) => {
        e.preventDefault();
        const content = document.getElementById("commentContent").value;
        addComment(image.imageId, content, userId);
      };
    }

    // Comment pagination events
    document.getElementById("prevCommentPage").onclick = () => {
      if (getCurrentCommentPage() > 0) {
        setCurrentCommentPage(getCurrentCommentPage() - 1);
        renderComments(image.imageId, userId);
      }
    };

    document.getElementById("nextCommentPage").onclick = () => {
      setCurrentCommentPage(getCurrentCommentPage() + 1);
      renderComments(image.imageId, userId);
    };

    // Render comments
    renderComments(image.imageId, userId);
  }

  // Render comments
  function renderComments(imageId, userId) {
    const currentUser = getCurrentUser();

    // Unauthenticated users cannot see comments
    if (!currentUser) {
      return;
    }

    const offset = getCurrentCommentPage() * COMMENTS_PER_PAGE;

    apiService
      .getComments(imageId, offset, COMMENTS_PER_PAGE)
      .then((data) => {
        const { comments, total } = data;
        const commentsList = document.getElementById("commentsList");
        commentsList.innerHTML = "";

        if (total === 0) {
          commentsList.innerHTML = '<p class="no-comments">No comments yet.</p>';
          document.getElementById("commentsPagination").style.display = "none";
          return;
        }

        comments.forEach((comment) => {
          const commentElement = document.createElement("div");
          commentElement.className = "comment-item";

          const canDelete =
            currentUser &&
            (comment.userId === currentUser.userId || // comment owner
              currentUser.userId === userId); // gallery owner

          // Format comment date in en-US
          const commentDate = new Date(comment.date);
          const formattedCommentDate = commentDate.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });

          commentElement.innerHTML = `
            <div class="comment-content">
              <p class="comment-text">${comment.content}</p>
              <div class="comment-meta">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${formattedCommentDate}</span>
                ${canDelete ? `<div class="comment-actions"><button class="btn small danger" onclick="deleteComment('${comment.commentId}', '${imageId}', '${userId}')">Delete</button></div>` : ""}
              </div>
            </div>
          `;

          commentsList.appendChild(commentElement);
        });

        document.getElementById("commentsPagination").style.display = "flex";
        document.getElementById("prevCommentPage").disabled = getCurrentCommentPage() === 0;
        document.getElementById("nextCommentPage").disabled = offset + COMMENTS_PER_PAGE >= total;
      })
      .catch((error) => {
        console.error("Error fetching comments:", error);
        document.getElementById("commentsList").innerHTML =
          '<p class="error">Failed to load comments.</p>';
      });
  }

  // Add comment
  function addComment(imageId, content, userId) {
    apiService
      .addComment(imageId, content)
      .then(() => {
        document.getElementById("commentContent").value = "";
        setCurrentCommentPage(0);
        renderComments(imageId, userId);
      })
      .catch((error) => {
        console.error("Error adding comment:", error);
        console.log("Failed to add comment: " + error.message);
      });
  }

  // Delete image
  function deleteImage(imageId, userId) {
    if (window.confirm("Are you sure you want to delete this image?")) {
      apiService
        .deleteImage(imageId)
        .then(() => {
          closeImageDetail();

          // After deletion, fetch image list and adjust page if needed
          const currentPage = getCurrentPage();
          const offset = currentPage * IMAGES_PER_PAGE;

          apiService
            .getUserGallery(userId, offset, IMAGES_PER_PAGE)
            .then((data) => {
              const { images, total } = data;

              // If no images on current page and previous page exists, go to previous page
              if (images.length === 0 && currentPage > 0) {
                setCurrentPage(currentPage - 1);
              }

              renderImageList(userId);
            })
            .catch((error) => {
              console.error("Error checking images after deletion:", error);
              renderImageList(userId);
            });
        })
        .catch((error) => {
          console.error("Error deleting image:", error);
          console.log("Failed to delete image: " + error.message);
        });
    }
  }

  // Delete comment
  function deleteComment(commentId, imageId, userId) {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      apiService
        .deleteComment(commentId)
        .then(() => {
          // After deletion, fetch comments and adjust page if needed
          const currentPage = getCurrentCommentPage();
          const offset = currentPage * COMMENTS_PER_PAGE;

          apiService
            .getComments(imageId, offset, COMMENTS_PER_PAGE)
            .then((data) => {
              const { comments, total } = data;

              // If no comments on current page and previous page exists, go to previous page
              if (comments.length === 0 && currentPage > 0) {
                setCurrentCommentPage(currentPage - 1);
              }

              renderComments(imageId, userId);
            })
            .catch((error) => {
              console.error("Error checking comments after deletion:", error);
              renderComments(imageId, userId);
            });
        })
        .catch((error) => {
          console.error("Error deleting comment:", error);
          console.log("Failed to delete comment: " + error.message);
        });
    }
  }

  // 이미지 상세보기 닫기
  function closeImageDetail() {
    elements.imageDetailGallery.classList.add("hidden");
    setSelectedImage(null);
  }

  // 전역 함수로 등록 (HTML에서 호출하기 위해)
  window.closeImageDetail = closeImageDetail;
  window.deleteImage = deleteImage;
  window.deleteComment = deleteComment;
  window.navigateTo = navigateTo;

  // 이미지 추가
  function addImage(userId) {
    const title = elements.imageTitleGallery.value.trim();
    const description = elements.imageDescriptionGallery.value.trim();
    const imageFile = elements.imageFileGallery.files[0];

    if (!imageFile) {
      console.log("Please select an image file");
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log("Please login to add images");
      return;
    }

    if (currentUser.userId !== userId) {
      console.log("You can only add images to your own gallery");
      return;
    }

    apiService
      .addImage(title, description, imageFile)
      .then(() => {
        elements.imageTitleGallery.value = "";
        elements.imageDescriptionGallery.value = "";
        elements.imageFileGallery.value = "";
        elements.addImageFormGallery.style.display = "none";
        renderImageList(userId);
        console.log("Image added successfully!");
      })
      .catch((error) => {
        console.error("Failed to add image:", error.message);
      });
  }

  // 앱 초기화
  function initApp() {
    checkAuthStatus();
    setupEventListeners();
    initRouter();
  }

  // 앱 시작
  initApp();
})();
