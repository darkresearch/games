
/**
 * Remember, you have access these globals:
 * 1. df - Just like the df object in your console.
 * 2. ui - For interacting with the game's user interface.
 *
 * Let's log these to the console when you run your plugin!
*/




function removeChildren(element) {
  while (element.firstChild) {
    element.lastChild.remove();
  }
}

function populateTable(table, header, rows) {
  
  removeChildren(table);
  
  const headerSection = document.createElement("thead");
  table.append(headerSection);
  
  const headerRow = document.createElement("tr");
  headerSection.append(headerRow);
  
  const headerCells = header.map(data => {
    const headerCell = document.createElement("th");
    headerCell.append(data);
    return headerCell;
  });
  headerRow.append(...headerCells);
  
    
  const bodySection = document.createElement("tbody");
  table.append(bodySection);
  
  const bodyRows = rows.map(row => {
    const bodyRow = document.createElement("tr");
    
    const bodyCells = row.map(data => {
      const bodyCell = document.createElement("td");
      bodyCell.append(data);
      return bodyCell;
    });
    
    bodyRow.append(...bodyCells);
    
    return bodyRow;
  });
  bodySection.append(...bodyRows);
  
}



class Plugin {
      
  constructor() {
    this.sortColumn = "score";
    this.ascending = false;
    this.table = null;
    this.updateIntervalId = null;
    
    
    const addressButton = document.createElement("a");
    addressButton.href = "javascript:void(0)";
    addressButton.textContent = "Address"
    addressButton.addEventListener("click", e => {
      this.changeSort("address");
      this.updateLeaderboard();
    });
    
    const scoreButton = document.createElement("a");
    scoreButton.href = "javascript:void(0)";
    scoreButton.textContent = "Score"
    scoreButton.addEventListener("click", e => {
      this.changeSort("score");
      this.updateLeaderboard();
    });
    
    const junkButton = document.createElement("a");
    junkButton.href = "javascript:void(0)";
    junkButton.textContent = "Junk"
    junkButton.addEventListener("click", e => {
      this.changeSort("junk");
      this.updateLeaderboard();
    });
    
    
    const junkLimitButton = document.createElement("a");
    junkLimitButton.href = "javascript:void(0)";
    junkLimitButton.textContent = "Junk Limit"
    junkLimitButton.addEventListener("click", e => {
      this.changeSort("junkLimit");
      this.updateLeaderboard();
    });
    
    this.header = [addressButton, scoreButton, junkButton, junkLimitButton];
  
  }
  
  changeSort(column) {
    if (this.sortColumn == column) {
      if (this.ascending) this.ascending = false;
      else this.sortColumn = null;
    }
    else {
      this.sortColumn = column;
      this.ascending = true;
    }
  }
  
  updateLeaderboard() {
    const table = this.table;
    const header = this.header;
    
    const players = df.getAllPlayers();
    
    const data = [];
    
    const myAddress = df.getAddress();
    
    for (const {address, score, spaceJunk, spaceJunkLimit} of players) data.push([address, score, spaceJunk, spaceJunkLimit]);
    
    header.forEach(button => button.style.textDecoration = "");
    
    switch (this.sortColumn) {
      case "address":
        data.sort((a, b) => a[0].localeCompare(b[0]));
        header[0].style.textDecoration = (this.ascending ? "underline" : "overline");
        break;
      case "score":
        data.sort((a, b) => a[1] - b[1]);
        header[1].style.textDecoration = (this.ascending ? "underline" : "overline");
        break;
      case "junk":
        data.sort((a, b) => a[2] - b[2]);
        header[2].style.textDecoration = (this.ascending ? "underline" : "overline");
        break;
      case "junkLimit":
        data.sort((a, b) => a[3] - b[3]);
        header[3].style.textDecoration = (this.ascending ? "underline" : "overline");
        break;
      default:
    }
    
    if (this.sortColumn != null && !this.ascending) data.reverse();
    
    for (const row of data) {
      
      
      const address = row[0];
      
      const addressBox = document.createElement("input");
      addressBox.readOnly = true;
      addressBox.value = address;
      addressBox.style.width = "8ch";
      addressBox.style.backgroundColor = "transparent";
      addressBox.addEventListener("click", e => e.target.select());
      
      if (address == myAddress) {
        addressBox.style.backgroundColor = "white";
        addressBox.style.color = "black";
      }
      
      row[0] = addressBox;
      
      
      const score = row[1];
      row[1] = score.toLocaleString();
    }
    
    populateTable(table, header, data);
  }
  
  /**
   * Called when plugin is launched with the "run" button.
   */
  async render(container) {
    const center = document.createElement("center");
    container.append(center);
    
    /*
    const h1 = document.createElement("h1");
    center.append(h1);
    
    h1.textContent = "Leaderboard";
    
    center.append(document.createElement("br"));
    */
    
    this.table = document.createElement("table");
    center.append(this.table);
    
    this.table.style.borderSpacing = "3ch 0.5em";
    this.table.style.borderCollapse = "separate";
    this.table.style.textAlign = "right";
    
    this.updateIntervalId = setInterval(() => this.updateLeaderboard(), 5000);
    
    this.updateLeaderboard();
  }

  /**
   * Called when plugin modal is closed.
   */
  destroy() {
    clearInterval(this.updateIntervalId);
    this.table = null;
    this.updateIntervalId = null;
  }
}

/**
 * And don't forget to export it!
 */
export default Plugin;

