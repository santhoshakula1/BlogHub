// =========================================================
// DRAFT: keeps the post you are writing safe
// =========================================================

const DRAFT_KEY = "bloghub_new_post_draft";
const NOTICE_KEY = "bloghub_login_notice";


function saveDraft(title, content) {

    try {

        if (!title && !content) {

            localStorage.removeItem(DRAFT_KEY);

            return;
        }

        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ title: title, content: content })
        );

    } catch (error) {
        // browser storage is unavailable: the draft is simply not saved
    }
}


function readDraft() {

    try {

        const raw = localStorage.getItem(DRAFT_KEY);

        if (!raw) {

            return null;
        }

        const draft = JSON.parse(raw);

        if (draft && (draft.title || draft.content)) {

            return draft;
        }

    } catch (error) {
        // unreadable draft: ignore it
    }

    return null;
}


function clearDraft() {

    try {

        localStorage.removeItem(DRAFT_KEY);

    } catch (error) {
        // nothing to do
    }
}
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    // Sent here because the session expired while writing a post?
    let resumeDraft = false;

    try {

        const notice = sessionStorage.getItem(NOTICE_KEY);

        if (notice) {

            document.getElementById("loginMessage").textContent = notice;

            sessionStorage.removeItem(NOTICE_KEY);

            resumeDraft = true;
        }

    } catch (error) {
        // storage unavailable: no notice
    }

    loginForm.addEventListener("submit", async function (event) {
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

                        setTimeout(function () {

                window.location.href =
                    (resumeDraft && readDraft())
                        ? "/new-post"
                        : "/profile";

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
function readRegisterError(data) {

    if (data && typeof data.detail === "string") {
        return data.detail;
    }

    if (data && Array.isArray(data.detail) && data.detail.length > 0) {

        const first = data.detail[0];
        const field = first.loc ? first.loc[first.loc.length - 1] : "";

        if (field === "email") {
            return "Please enter a valid email address, like name@example.com.";
        }
        if (field === "username") {
            return "Username must be 3 to 30 characters: letters, numbers and underscores only.";
        }
        if (field === "password") {
            return "Password must be 8 to 128 characters and not a very common password.";
        }
    }

    return "Registration failed. Please check your details.";
}
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

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

                message.textContent =readRegisterError(data);

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


function logout(keepDraft) {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "token_type"
    );

    
    if (!keepDraft) {

        clearDraft();
    }

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

               // 401 = the token is missing, expired or invalid: log out.
        // Any other failure (server error, outage) must NOT log the user out.
        if (response.status === 401) {

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

        if (!response.ok) {

            if (messageElement) {

                messageElement.textContent =
                    "Something went wrong. Please try again.";
            }

            return;
        }

        const data =
            await response.json();

        idElement.textContent =
            data.id;
        usernameElement.textContent =
            data.username;

        emailElement.textContent =
            data.email;

            createdElement.textContent =
            data.created_at
                ? new Date(data.created_at).toLocaleString()
                : "Unknown";
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

// New Post page: restore a saved draft and save while typing
document.addEventListener("DOMContentLoaded", function () {

    if (window.location.pathname !== "/new-post") {

        return;
    }

    const titleInput = document.getElementById("title");

    const contentInput = document.getElementById("content");

    if (!titleInput || !contentInput) {

        return;
    }

    const draft = readDraft();

    if (draft) {

        titleInput.value = draft.title || "";

        contentInput.value = draft.content || "";
    }

    function autoSave() {

        saveDraft(titleInput.value, contentInput.value);
    }

    titleInput.addEventListener("input", autoSave);

    contentInput.addEventListener("input", autoSave);
});


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

                // the session expired: keep the draft, ask for a new login
                saveDraft(title, content);

                try {

                    sessionStorage.setItem(
                        NOTICE_KEY,
                        "Your session expired. Log in again and your post will be waiting for you."
                    );

                } catch (error) {
                    // storage unavailable: no notice
                }

                logout(true);

                return;
            }

            message.textContent =
                typeof data.detail === "string"
                    ? data.detail
                    : "Please check your title (max 100 characters) and content (max 20,000 characters).";
            return;
        }

        clearDraft();

        message.textContent =
            "Post created successfully!";

        setTimeout(function () {

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


const PAGE_SIZE = 10;

let postsShown = 0;


async function loadPosts(loadMore) {

    const postsContainer =
        document.getElementById(
            "blogContainer"
        );

    if (!postsContainer) {

        return;
    }

    const moreButton =
        document.getElementById(
            "loadMoreButton"
        );

    // first load starts at 0; "Load more" continues after the posts shown
    const offset = loadMore ? postsShown : 0;

    if (loadMore && moreButton) {

        moreButton.disabled = true;

        moreButton.textContent = "Loading...";
    }

    try {

        // Ask for ONE more than we show. If it arrives, another page exists.
        const response =
            await fetch(
                `/api/posts?limit=${PAGE_SIZE + 1}&offset=${offset}`
            );

        const posts =
            await response.json();

        if (!response.ok) {

            throw new Error(
                "Failed to load posts."
            );
        }

        const hasMore = posts.length > PAGE_SIZE;

        const pagePosts = posts.slice(0, PAGE_SIZE);

        if (!loadMore) {

            if (!pagePosts.length) {

                postsContainer.innerHTML =
                    "<p>No blog posts available.</p>";

                if (moreButton) {

                    moreButton.style.display = "none";
                }

                return;
            }

            postsContainer.innerHTML = "";

            postsShown = 0;
        }

        pagePosts.forEach(function (post) {

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
                        ${escapeHTML(post.excerpt)}
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

        postsShown += pagePosts.length;

        if (moreButton) {

            moreButton.disabled = false;

            moreButton.textContent = "Load more posts";

            moreButton.style.display =
                hasMore ? "inline-block" : "none";
        }

    } catch (error) {

        console.error(
            "Error loading posts:",
            error
        );

        if (loadMore) {

            // keep the posts already on screen, let the user try again
            if (moreButton) {

                moreButton.disabled = false;

                moreButton.textContent =
                    "Could not load more. Try again";
            }

        } else {

            postsContainer.innerHTML =
                "<p>Unable to load blog posts.</p>";
        }
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
    function () {

        updateAuthUI();

        loadDarkMode();

        loadPosts();

        loadProfile();

        showAdminLink();

        loadAdminUsers();
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

    const message = document.getElementById("message");

    try {

        const response = await fetch("/api/posts/" + getPostId());

        if (response.status === 404) {

            message.textContent = "Post not found.";

            return;
        }

        if (!response.ok) {

            message.textContent = "Could not load the post. Please try again.";

            return;
        }

        const post = await response.json();

        document.getElementById("title").value = post.title;

        document.getElementById("content").value = post.content;

    } catch (error) {

        console.error("Load post error:", error);

        message.textContent = "Unable to connect to the server.";
    }
}


async function updatePost() {

    const title = document.getElementById("title").value.trim();

    const content = document.getElementById("content").value.trim();

    const message = document.getElementById("message");

    if (!title || !content) {

        message.textContent = "Please enter title and content.";

        return;
    }

    message.textContent = "Saving...";

    try {

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

        if (response.status === 404) {

            message.textContent = "This post no longer exists.";

            return;
        }

        if (response.status === 422) {

            message.textContent =
                "Please check your title (max 100 characters) and content (max 20,000 characters).";

            return;
        }

        // Anything else that is not a success (a server error, for example)
        // must NOT be treated as "saved".
        if (!response.ok) {

            message.textContent =
                "Could not save your changes. Please try again.";

            return;
        }

        window.location.href = "/blog/" + getPostId();

    } catch (error) {

        console.error("Update post error:", error);

        message.textContent = "Unable to connect to the server.";
    }
}
// Shows the Edit / Delete buttons on the blog page.
// Edit    -> only the post's author
// Delete  -> the post's author OR an admin
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

    const isOwner = Number(me.id) === Number(authorId);

    const isAdmin = me.is_admin === true;

    if (isOwner) {

        const link = document.getElementById("editPostLink");

        if (link) {

            link.href = "/edit-post/" + getPostId();

            link.classList.remove("hidden");
        }
    }

    if (isOwner || isAdmin) {

        const deleteButton =
            document.getElementById("deletePostButton");

        if (deleteButton) {

            deleteButton.classList.remove("hidden");
        }
    }
}

// Reads the error text from a failed response. If the server sent plain
// text (e.g. a crash), falls back to the message you give it.
async function readError(response, fallback) {

    try {

        const data = await response.json();

        if (typeof data.detail === "string") {

            return data.detail;
        }

    } catch (e) {
        // not JSON: use the fallback
    }

    return fallback;
}


async function deletePost() {

    const confirmed = confirm(
        "Delete this post? This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    if (!isLoggedIn()) {

        window.location.href = "/login";

        return;
    }

    try {

        const response = await fetch(
            `/api/posts/${getPostId()}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (response.status === 401) {

            logout();

            return;
        }

        if (!response.ok) {

            alert(
                await readError(response, "Could not delete the post.")
            );

            return;
        }

        window.location.href = "/";

    } catch (error) {

        console.error("Delete post error:", error);

        alert("Unable to connect to the server.");
    }
}


// =========================================================
// ADMIN
// =========================================================

// Shows the "Admin" link in the navbar, only for admins
async function showAdminLink() {

    const adminLink = document.getElementById("adminLink");

    if (!adminLink || !isLoggedIn()) {

        return;
    }

    try {

        const response = await fetch("/api/auth/me", {
            headers: getAuthHeaders()
        });

        if (!response.ok) {

            return;
        }

        const me = await response.json();

        if (me.is_admin) {

            adminLink.style.display = "inline-block";
        }

    } catch (error) {

        console.error("Admin link error:", error);
    }
}


// Fills the table on the /admin page
async function loadAdminUsers() {

    const tableBody = document.getElementById("adminUsersBody");

    if (!tableBody) {

        return;
    }

    const message = document.getElementById("adminMessage");

    if (!isLoggedIn()) {

        window.location.href = "/login";

        return;
    }

    try {

        const meResponse = await fetch("/api/auth/me", {
            headers: getAuthHeaders()
        });

        if (meResponse.status === 401) {

            logout();

            return;
        }

        const me = await meResponse.json();

        const response = await fetch("/api/admin/users", {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {

            logout();

            return;
        }

        if (response.status === 403) {

            message.textContent = "Only admins can open this page.";

            return;
        }

        if (!response.ok) {

            message.textContent = "Could not load users.";

            return;
        }

        const users = await response.json();

        message.textContent = users.length + " registered users";

        tableBody.innerHTML = "";

        users.forEach(function (user) {

            const row = document.createElement("tr");

            [
                user.id,
                user.username,
                user.email,
                user.is_admin ? "Admin" : "User"
            ].forEach(function (value) {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            // an admin cannot delete their own account (the server blocks it too)
                        // admin accounts are protected (the server blocks deleting them too)
            if (!user.is_admin) {

                const button = document.createElement("button");

                button.className = "delete-button";

                button.textContent = "Delete";

                button.addEventListener("click", function () {

                    deleteUser(user.id, user.username);
                });

                actionCell.appendChild(button);

            } else {

                actionCell.textContent = "Protected";
            }

            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error("Load users error:", error);

        message.textContent = "Unable to connect to the server.";
    }
}


async function deleteUser(userId, username) {

    const confirmed = confirm(
        'Delete user "' + username + '" and ALL of their posts? This cannot be undone.'
    );

    if (!confirmed) {

        return;
    }

    try {

        const response = await fetch(
            `/api/admin/users/${userId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (response.status === 401) {

            logout();

            return;
        }

        if (!response.ok) {

            let errorMessage = "Could not delete the user.";

            try {

                const data = await response.json();

                if (typeof data.detail === "string") {

                    errorMessage = data.detail;
                }

            } catch (e) {
                // server sent no JSON: keep the default message
            }

            alert(errorMessage);

            return;
        }

        loadAdminUsers();

    } catch (error) {

        console.error("Delete user error:", error);

        alert("Unable to connect to the server.");
    }
}