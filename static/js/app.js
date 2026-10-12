const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");

        if (!username || !password) {

            message.textContent =
                "Please enter username and password.";

            return;
        }

        message.textContent =
            "Logging in...";

        try {

            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Invalid username or password.";

                return;
            }

            localStorage.setItem(
                "access_token",
                data.access_token
            );

            localStorage.setItem(
                "token_type",
                data.token_type || "bearer"
            );

            message.textContent =
                "Login successful!";

            setTimeout(function() {

                window.location.href =
                    "/profile";

            }, 500);

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";
        }

    });
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("registerMessage");

        message.textContent = "Registering...";

        try {

            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.detail ||
                    "Registration failed.";

                return;
            }

            message.textContent =
                "Registration successful!";

            registerForm.reset();

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";
        }

    });

}
function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );
}


function getTokenType() {

    return localStorage.getItem(
        "token_type"
    ) || "bearer";
}


function getAuthHeaders() {

    const token =
        getAccessToken();

    if (!token) {

        return {};
    }

    return {
        "Authorization":
            `${getTokenType()} ${token}`
    };
}


function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "token_type"
    );

    window.location.href =
        "/login";
}


function isLoggedIn() {

    return Boolean(
        getAccessToken()
    );
}


function requireLogin() {

    if (!isLoggedIn()) {

        window.location.href =
            "/login";
    }
}


async function loadProfile() {

    const usernameElement =
        document.getElementById(
            "profileUsername"
        );

    const emailElement =
        document.getElementById(
            "profileEmail"
        );

    const idElement =
        document.getElementById(
            "profileId"
        );

    const createdElement =
        document.getElementById(
            "profileCreated"
        );

    const messageElement =
        document.getElementById(
            "profileMessage"
        );

    if (
        !usernameElement ||
        !emailElement ||
        !idElement ||
        !createdElement
    ) {

        return;
    }

    const token =
        getAccessToken();

    if (!token) {

        window.location.href =
            "/login";

        return;
    }

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    headers: getAuthHeaders()
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "token_type"
            );

            window.location.href =
                "/login";

            return;
        }

        idElement.textContent =
            data.id;

        usernameElement.textContent =
            data.username;

        emailElement.textContent =
            data.email;

        createdElement.textContent =
            new Date(
                data.created_at
            ).toLocaleString();

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        if (messageElement) {

            messageElement.textContent =
                "Unable to load profile.";
        }
    }
}


async function createPost() {

    const title =
        document.getElementById(
            "title"
        ).value.trim();

    const content =
        document.getElementById(
            "content"
        ).value.trim();

    const message =
        document.getElementById(
            "message"
        );

    if (!title || !content) {

        message.textContent =
            "Please enter title and content.";

        return;
    }

    const token =
        getAccessToken();

    if (!token) {

        window.location.href =
            "/login";

        return;
    }

    try {

        const response =
            await fetch(
                "/api/posts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...getAuthHeaders()
                    },

                    body: JSON.stringify({
                        title: title,
                        content: content
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            if (response.status === 401) {

                logout();

                return;
            }

            message.textContent =
                typeof data.detail ==="string"
                ? data.detail
                : "please check your title(max 100 characters) and content.";

            return;
        }

        message.textContent =
            "Post created successfully!";

        setTimeout(function() {

            window.location.href = "/";

        }, 1000);

    } catch (error) {

        console.error(
            "Create post error:",
            error
        );

        message.textContent =
            "Unable to connect to the server.";
    }
}


async function loadPosts() {

    const postsContainer =
        document.getElementById(
            "blogContainer"
        );

    if (!postsContainer) {

        return;
    }

    try {

        const response =
            await fetch(
                "/api/posts"
            );

        const posts =
            await response.json();

        if (!response.ok) {

            throw new Error(
                "Failed to load posts."
            );
        }

        if (!posts.length) {

            postsContainer.innerHTML =
                "<p>No blog posts available.</p>";

            return;
        }

        postsContainer.innerHTML = "";

        posts.forEach(function(post) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "blog-card";

            card.innerHTML = `
                <div class="blog-content">

                    <h3>
                        ${escapeHTML(post.title)}
                    </h3>

                    <p class="blog-description">
                        ${escapeHTML(post.content)}
                    </p>

                    <p class="blog-author">
                        By ${escapeHTML(post.author.username)}
                        . ${formatDate(post.created_at)}
                    </p>

                    <a
                        href="/blog/${post.id}"
                        class="read-more"
                    >
                        Read More
                    </a>

                </div>
            `;

            postsContainer.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Error loading posts:",
            error
        );

        postsContainer.innerHTML =
            "<p>Unable to load blog posts.</p>";
    }
}
function formatDate(value) {

    if (!value) {
        return "";
    }

    return new Date(value).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function escapeHTML(value) {

    const element =
        document.createElement(
            "div"
        );

    element.textContent =
        value ?? "";

    return element.innerHTML;
}


function updateAuthUI() {

    const loggedIn =
        isLoggedIn();

    const loginLink =
        document.getElementById(
            "loginLink"
        );

    const registerLink =
        document.getElementById(
            "registerLink"
        );

    const profileLink =
        document.getElementById(
            "profileLink"
        );

    const newPostLink =
        document.getElementById(
            "newPostLink"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (loginLink) {

        loginLink.style.display =
            loggedIn
                ? "none"
                : "inline-block";
    }

    if (registerLink) {

        registerLink.style.display =
            loggedIn
                ? "none"
                : "inline-block";
    }

    if (profileLink) {

        profileLink.style.display =
            loggedIn
                ? "inline-block"
                : "none";
    }

    if (newPostLink) {

        newPostLink.style.display =
            loggedIn
                ? "inline-block"
                : "none";
    }

    if (logoutButton) {

        logoutButton.style.display =
            loggedIn
                ? "inline-block"
                : "none";
    }
}


function changeMode() {

    document.body.classList.toggle(
        "dark"
    );

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains(
            "dark"
        )
    );
}


function loadDarkMode() {

    const darkMode =
        localStorage.getItem(
            "darkMode"
        );

    if (darkMode === "true") {

        document.body.classList.add(
            "dark"
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateAuthUI();

        loadDarkMode();

        loadPosts();

        loadProfile();
    }
);
// =========================================================
// EDIT POST
// =========================================================

function getPostId() {

    return window.location.pathname.split("/").pop();
}


async function loadPostForEdit() {

    if (!isLoggedIn()) {

        window.location.href = "/login";

        return;
    }

    const response = await fetch("/api/posts/" + getPostId());

    if (!response.ok) {

        document.getElementById("message").textContent = "Post not found.";

        return;
    }

    const post = await response.json();

    document.getElementById("title").value = post.title;

    document.getElementById("content").value = post.content;
}


async function updatePost() {

    const title = document.getElementById("title").value.trim();

    const content = document.getElementById("content").value.trim();

    const message = document.getElementById("message");

    if (!title || !content) {

        message.textContent = "Please enter title and content.";

        return;
    }

    const response = await fetch("/api/posts/" + getPostId(), {

        method: "PUT",

        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },

        body: JSON.stringify({
            title: title,
            content: content
        })
    });

    if (response.status === 401) {

        logout();

        return;
    }

    if (response.status === 403) {

        message.textContent = "You can only edit your own posts.";

        return;
    }

    if (!response.ok) {

        message.textContent = "Could not update post.";

        return;
    }

    window.location.href = "/blog/" + getPostId();
}


// Shows the Edit button on the blog page, only for the post's author
async function showEditButton(authorId) {

    if (!isLoggedIn()) {

        return;
    }

    const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders()
    });

    if (!response.ok) {

        return;
    }

    const me = await response.json();

    if (me.id === authorId) {

        const link = document.getElementById("editPostLink");

        link.href = "/edit-post/" + getPostId();

        link.classList.remove("hidden");
    }
}