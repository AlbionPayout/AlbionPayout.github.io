let memberId = 0;
  let guildMembers = [];

  async function fetchGuildMembers() {
    try {
      const searchRes = await fetch("https://corsproxy.io/?https://gameinfo-ams.albiononline.com/api/gameinfo/search?q=Les Chomeurs");
      const searchData = await searchRes.json();
      const guild = searchData.guilds.find(g => g.Name === "Les Chomeurs");
      if (!guild) {
        alert("Guilde 'Les Chomeurs' non trouvée !");
        return;
      }

      const guildId = guild.Id;
      const memberRes = await fetch(`https://corsproxy.io/?https://gameinfo-ams.albiononline.com/api/gameinfo/guilds/${guildId}/members`);
      const members = await memberRes.json();

      guildMembers = members.map(m => m.Name).sort();

      const dataList = document.getElementById("member-suggestions");
      dataList.innerHTML = '';
      guildMembers.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        dataList.appendChild(option);
      });
    } catch (error) {
      console.error("Erreur API Albion:", error);
      alert("Impossible de récupérer les membres de la guilde.");
    }
  }

  function formatNumber(num) {
  return num.toLocaleString('fr-FR').replace(/\s/g, '\u00A0');
  }


  function addMember(name = '') {
    const membersList = document.getElementById('membersList');

    const div = document.createElement('div');
    div.className = 'member-entry';
    div.dataset.id = memberId;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nom du membre';
    input.value = name;
    input.setAttribute('list', 'member-suggestions');
    input.addEventListener('input', () => updateRepairDropdown());

    const remove = document.createElement('button');
    remove.textContent = 'X';
    remove.className = 'remove-btn';
    remove.onclick = () => div.remove();

    div.appendChild(input);
    div.appendChild(remove);
    membersList.appendChild(div);

    memberId++;
  }

  function updateRepairDropdown() {
  const select = document.getElementById('repairTarget');
  const memberInputs = document.querySelectorAll('#membersList input[type="text"]');

  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Aucun --</option>';

  memberInputs.forEach(input => {
    const name = input.value.trim();
    if (name) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      if (name === currentValue) option.selected = true;
      select.appendChild(option);
    }
  });
}

  function calculateSplit() {
  const total = parseFloat(document.getElementById('chestTotal').value);
  const repairCost = parseFloat(document.getElementById('repairCost').value) || 0;
  const repairTarget = document.getElementById('repairTarget').value;
  const result = document.getElementById('result');
  const memberInputs = document.querySelectorAll('#membersList input[type="text"]');

  result.innerHTML = '';

  const names = Array.from(memberInputs).map(input => input.value.trim()).filter(name => name);

  if (isNaN(total) || total <= 0 || names.length === 0) {
    result.innerHTML = '<p style="color: red;">Veuillez entrer un total valide et au moins un membre.</p>';
    return;
  }

  if (repairCost > total) {
    result.innerHTML = '<p style="color: red;">Le coût de réparation ne peut pas dépasser le total du coffre.</p>';
    return;
  }

  const totalAfterRepair = total - repairCost;
  const split = totalAfterRepair / names.length;
  const formattedSplit = formatNumber(split.toFixed(2));
  const header = document.createElement('h2');
  result.appendChild(header);

  names.forEach((name, i) => {
    const div = document.createElement('div');
    div.className = 'member';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `pay-${i}`;

    const label = document.createElement('label');
    let payout = split;

    if (repairTarget && name === repairTarget) {
      payout += repairCost;
      label.textContent = `${name} (Remboursé) - ${formatNumber(Math.round(payout))} Silver`;
    } else {
      label.textContent = `${name} - ${formatNumber(Math.round(payout))} Silver`;
    }

    label.htmlFor = checkbox.id;

    checkbox.addEventListener('change', () => {
      label.classList.toggle('paid', checkbox.checked);
    });

    div.appendChild(checkbox);
    div.appendChild(label);
    result.appendChild(div);
  });
}

  window.addEventListener('DOMContentLoaded', fetchGuildMembers);