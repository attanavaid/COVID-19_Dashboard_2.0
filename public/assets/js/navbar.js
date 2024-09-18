import "../../style.css";

document.querySelector("#header").innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-light">
    <a href="/" class="navbar-brand">
      <i class="nav-maintitle">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;County COVID
        App&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </i>
    </a>
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#collapsibleNavbar"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="collapsibleNavbar">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a href="/" class="nav-link">
            <i class="nav-title">Home</i>
          </a>
        </li>
        <li class="nav-item">
          <a href="/news" class="nav-link">
            <i class="nav-title">News</i>
          </a>
        </li>
        <li class="nav-item">
          <a href="/settings" class="nav-link">
            <i class="nav-title">Settings</i>
          </a>
        </li>
        <li class="nav-item">
          <a href="/about" class="nav-link">
            <i class="nav-title">About</i>
          </a>
        </li>
        <li class="nav-item">
          <a href="/help" class="nav-link">
            <i class="nav-title">Help</i>
          </a>
        </li>
      </ul>
    </div>
  </nav>
`;