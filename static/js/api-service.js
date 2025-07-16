"use strict";

let apiService = (function () {
  let module = {};

  // Cross-browser fetch fallback
  const fetchWithFallback = (url, options = {}) => {
    if (typeof fetch !== "undefined") {
      return fetch(url, options);
    } else if (typeof XMLHttpRequest !== "undefined") {
      // XMLHttpRequest fallback for IE9+
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || "GET", url, true);

        if (options.headers) {
          Object.keys(options.headers).forEach((key) => {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            });
          } else {
            reject({
              ok: false,
              status: xhr.status,
              statusText: xhr.statusText,
            });
          }
        };

        xhr.onerror = () => {
          reject({
            ok: false,
            status: 0,
            statusText: "Network Error",
          });
        };

        xhr.send(options.body);
      });
    } else {
      throw new Error("No HTTP client available");
    }
  };

  /*  ******* Data types *******
    user objects must have at least the following attributes:
        - (String) userId 
        - (String) username
        - (String) email
        - (Date) date

    image objects must have at least the following attributes:
        - (String) imageId 
        - (String) userId
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) userId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date
  */

  // API base URL
  const API_BASE_URL = "/api";

  // Auth related API
  module.getCurrentUser = function () {
    console.log("[API] Getting current user");
    return fetchWithFallback(`${API_BASE_URL}/auth/me`).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to get current user, status:", response.status);
        throw new Error(`Failed to get current user: ${response.status}`);
      }
      return response.json();
    });
  };

  module.login = function (username, password) {
    console.log("[API] Logging in user:", username);

    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    return fetchWithFallback(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password,
      }),
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to login, status:", response.status);
        return response.json().then((errorData) => {
          throw new Error(errorData.error || `Login failed: ${response.status}`);
        });
      }
      return response.json();
    });
  };

  module.signup = function (username, email, password) {
    console.log("[API] Signing up user:", username);

    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required");
    }

    return fetchWithFallback(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        email: email.trim(),
        password: password,
      }),
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to signup, status:", response.status);
        return response.json().then((errorData) => {
          throw new Error(errorData.error || `Signup failed: ${response.status}`);
        });
      }
      return response.json();
    });
  };

  module.logout = function () {
    console.log("[API] Logging out");
    return fetchWithFallback(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to logout, status:", response.status);
        throw new Error(`Failed to logout: ${response.status}`);
      }
      return response.json();
    });
  };

  // User gallery related API
  module.getUsers = function (offset = 0, limit = 10) {
    console.log("[API] Fetching users, offset:", offset, "limit:", limit);
    return fetchWithFallback(`${API_BASE_URL}/users?offset=${offset}&limit=${limit}`).then(
      (response) => {
        if (!response.ok) {
          console.error("[API ERROR] Failed to fetch users, status:", response.status);
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        return response.json();
      }
    );
  };

  module.getUser = function (userId) {
    console.log("[API] Fetching user:", userId);
    return fetchWithFallback(`${API_BASE_URL}/users/${userId}`).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to fetch user, status:", response.status);
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      return response.json();
    });
  };

  module.getUserGallery = function (userId, offset = 0, limit = 10) {
    console.log("[API] Fetching user gallery:", userId, "offset:", offset, "limit:", limit);
    return fetchWithFallback(
      `${API_BASE_URL}/users/${userId}?offset=${offset}&limit=${limit}`
    ).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to fetch user gallery, status:", response.status);
        throw new Error(`Failed to fetch user gallery: ${response.status}`);
      }
      return response.json();
    });
  };

  // Image related API (legacy support)
  module.getImages = function (offset = 0, limit = 10) {
    console.log("[API] Fetching images, offset:", offset, "limit:", limit);
    return fetchWithFallback(`${API_BASE_URL}/images?offset=${offset}&limit=${limit}`).then(
      (response) => {
        if (!response.ok) {
          console.error("[API ERROR] Failed to fetch images, status:", response.status);
          throw new Error(`Failed to fetch images: ${response.status}`);
        }
        return response.json();
      }
    );
  };

  // Add image (requires authentication)
  module.addImage = function (title, description, imageFile) {
    console.log("[API] Adding image, title:", title);

    // Input validation
    if (!title || !imageFile) {
      throw new Error("Title and image file are required");
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    if (description && description.trim()) {
      formData.append("description", description.trim());
    }
    formData.append("image", imageFile);

    return fetchWithFallback(`${API_BASE_URL}/images`, {
      method: "POST",
      body: formData,
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to add image, status:", response.status);
        throw new Error(`Failed to add image: ${response.status}`);
      }
      return response.json();
    });
  };

  // Delete image (gallery owner only)
  module.deleteImage = function (imageId) {
    console.log("[API] Deleting image:", imageId);

    if (!imageId) {
      throw new Error("Image ID is required");
    }

    return fetchWithFallback(`${API_BASE_URL}/images/${imageId}`, {
      method: "DELETE",
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to delete image, status:", response.status);
        throw new Error(`Failed to delete image: ${response.status}`);
      }
      return true;
    });
  };

  // Get specific image
  module.getImage = function (imageId) {
    console.log("[API] Fetching image:", imageId);

    if (!imageId) {
      throw new Error("Image ID is required");
    }

    return fetchWithFallback(`${API_BASE_URL}/images/${imageId}`).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to fetch image, status:", response.status);
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      return response.json();
    });
  };

  // Get comments list
  module.getComments = function (imageId, offset = 0, limit = 10) {
    console.log("[API] Fetching comments for image:", imageId, "offset:", offset, "limit:", limit);

    if (!imageId) {
      throw new Error("Image ID is required");
    }

    return fetchWithFallback(
      `${API_BASE_URL}/images/${imageId}/comments?offset=${offset}&limit=${limit}`
    ).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to fetch comments, status:", response.status);
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      return response.json();
    });
  };

  // Add comment (requires authentication)
  module.addComment = function (imageId, content) {
    console.log("[API] Adding comment for image:", imageId);

    // Input validation
    if (!imageId || !content) {
      throw new Error("Image ID and content are required");
    }

    return fetchWithFallback(`${API_BASE_URL}/images/${imageId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content.trim(),
      }),
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to add comment, status:", response.status);
        throw new Error(`Failed to add comment: ${response.status}`);
      }
      return response.json();
    });
  };

  // Delete comment (comment owner or gallery owner only)
  module.deleteComment = function (commentId) {
    console.log("[API] Deleting comment:", commentId);

    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    return fetchWithFallback(`${API_BASE_URL}/comments/${commentId}`, {
      method: "DELETE",
    }).then((response) => {
      if (!response.ok) {
        console.error("[API ERROR] Failed to delete comment, status:", response.status);
        throw new Error(`Failed to delete comment: ${response.status}`);
      }
      return true;
    });
  };

  return module;
})();
