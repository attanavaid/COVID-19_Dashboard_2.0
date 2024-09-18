import "../../style.css";

document.querySelector("#footer").innerHTML = `
  <div class = "footer">
    <div class = "container">
      <img src = "/assets/img/icons/AppLogo.png" class = "float-left mt-4 mb-4" width = "72" height = "72">
      <p class = "mt-4 mb-4 float-right">
        &copy; 2021. All rights reserved. This application® is a registered trademark of the University of Maryland, Baltimore County.
        <br>
        Website made by Team 04.
        <br>
        <a href = "/policy">Privacy Policy</a> | <a href = "/terms">Terms of Service</a> 
      </p>
    </div>
  </div>
`;