const machineRecords = [];
const aulaRecords = [];

const formMaquina = document.getElementById("formMaquina");
const tablaPreview = document.querySelector("#tablaPreview tbody");
const btnExportar = document.getElementById("btnExportar");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnGuardarComponentes = document.getElementById("btnGuardarComponentes");

const chkProyector = document.getElementById("chkProyector");
const chkParlantes = document.getElementById("chkParlantes");
const proyectorBlock = document.getElementById("proyectorBlock");
const parlantesBlock = document.getElementById("parlantesBlock");

function hoyFormato() {
  const d = new Date();
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

document.getElementById("fechaGeneracion").value = hoyFormato();
document.getElementById("anio").value = new Date().getFullYear();

function leer(id) {
  return document.getElementById(id).value.trim();
}

function setEstadoColor(select) {
  select.classList.remove("estado-bueno", "estado-malogrado");
  if (select.value === "Bueno") select.classList.add("estado-bueno");
  if (select.value === "Malogrado") select.classList.add("estado-malogrado");
}

function activarColoresEstados() {
  document.querySelectorAll(".estado-select").forEach((sel) => {
    setEstadoColor(sel);
    sel.addEventListener("change", () => setEstadoColor(sel));
  });
}

function toggleBlock(checkbox, block) {
  const update = () => {
    block.classList.toggle("hidden", !checkbox.checked);
  };
  checkbox.addEventListener("change", update);
  update();
}

toggleBlock(chkProyector, proyectorBlock);
toggleBlock(chkParlantes, parlantesBlock);
activarColoresEstados();

function hasMainData(obj) {
  return ["marca", "modelo", "serie", "patrimonial", "observaciones"].some(
    (k) => (obj[k] || "").toString().trim() !== ""
  );
}

function upsertByKey(list, keyFn, item) {
  const index = list.findIndex((x) => keyFn(x) === keyFn(item));
  if (index >= 0) {
    list[index] = item;
  } else {
    list.push(item);
  }
}

function readMachineComponent(prefix, componente) {
  return {
    tipo: "Máquina",
    aula: leer("aulaMaquina"),
    numeroMaquina: leer("numeroMaquina"),
    componente,
    marca: leer(`${prefix}_marca`),
    modelo: leer(`${prefix}_modelo`),
    serie: leer(`${prefix}_serie`),
    patrimonial: leer(`${prefix}_patrimonial`),
    estado: leer(`${prefix}_estado`),
    observaciones: leer(`${prefix}_obs`)
  };
}

function readAulaComponent(prefix, componente) {
  return {
    tipo: "Aula",
    aula: leer("aulaComponentes"),
    numeroMaquina: "",
    componente,
    marca: leer(`${prefix}_marca`),
    modelo: leer(`${prefix}_modelo`),
    serie: leer(`${prefix}_serie`),
    patrimonial: leer(`${prefix}_patrimonial`),
    estado: leer(`${prefix}_estado`),
    observaciones: leer(`${prefix}_obs`)
  };
}

function renderPreview() {
  tablaPreview.innerHTML = "";

  const allRows = [...machineRecords, ...aulaRecords];

  allRows.forEach((row, index) => {
    const tr = document.createElement("tr");
    const estadoClass = row.estado === "Bueno" ? "estado-bueno" : "estado-malogrado";

    tr.innerHTML = `
      <td>${row.tipo}</td>
      <td>${row.aula || "-"}</td>
      <td>${row.numeroMaquina || "-"}</td>
      <td>${row.componente || "-"}</td>
      <td>${row.marca || "-"}</td>
      <td>${row.modelo || "-"}</td>
      <td>${row.serie || "-"}</td>
      <td>${row.patrimonial || "-"}</td>
      <td class="${estadoClass}">${row.estado || "-"}</td>
      <td>${row.observaciones || "-"}</td>
      <td><button class="btn-mini" data-type="${row.tipo}" data-index="${index}">Eliminar</button></td>
    `;

    tablaPreview.appendChild(tr);
  });

  document.querySelectorAll(".btn-mini").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const type = btn.dataset.type;

      const merged = [...machineRecords, ...aulaRecords];
      const target = merged[index];
      if (!target) return;

      if (type === "Máquina") {
        const key = `${target.aula}|${target.numeroMaquina}|${target.componente}`;
        const idx = machineRecords.findIndex(
          (x) => `${x.aula}|${x.numeroMaquina}|${x.componente}` === key
        );
        if (idx >= 0) machineRecords.splice(idx, 1);
      } else {
        const key = `${target.aula}|${target.componente}`;
        const idx = aulaRecords.findIndex(
          (x) => `${x.aula}|${x.componente}` === key
        );
        if (idx >= 0) aulaRecords.splice(idx, 1);
      }

      renderPreview();
    });
  });
}

formMaquina.addEventListener("submit", (e) => {
  e.preventDefault();

  const aula = leer("aulaMaquina");
  const numeroMaquina = leer("numeroMaquina");

  if (!aula || !numeroMaquina) {
    alert("Completa el aula y el número de máquina.");
    return;
  }

  const componentes = [
    { prefix: "cpu", nombre: "CPU" },
    { prefix: "pantalla", nombre: "Pantalla" },
    { prefix: "mouse", nombre: "Mouse" },
    { prefix: "teclado", nombre: "Teclado" }
  ];

  let agregados = 0;

  componentes.forEach(({ prefix, nombre }) => {
    const item = readMachineComponent(prefix, nombre);

    if (hasMainData(item)) {
      upsertByKey(
        machineRecords,
        (x) => `${x.aula}|${x.numeroMaquina}|${x.componente}`,
        item
      );
      agregados += 1;
    }
  });

  if (agregados === 0) {
    alert("Ingresa al menos un dato en CPU, pantalla, mouse o teclado.");
    return;
  }

  renderPreview();
  formMaquina.reset();
  document.getElementById("aulaMaquina").value = aula;
  document.getElementById("numeroMaquina").value = numeroMaquina;
  activarColoresEstados();
  alert("Máquina agregada correctamente.");
});

btnGuardarComponentes.addEventListener("click", () => {
  const aula = leer("aulaComponentes");
  if (!aula) {
    alert("Completa el aula antes de guardar los componentes del aula.");
    return;
  }

  let agregados = 0;

  if (chkProyector.checked) {
    const item = readAulaComponent("proyector", "Proyector");
    if (hasMainData(item)) {
      upsertByKey(aulaRecords, (x) => `${x.aula}|${x.componente}`, item);
      agregados += 1;
    }
  }

  if (chkParlantes.checked) {
    const item = readAulaComponent("parlantes", "Parlantes");
    if (hasMainData(item)) {
      upsertByKey(aulaRecords, (x) => `${x.aula}|${x.componente}`, item);
      agregados += 1;
    }
  }

  if (agregados === 0) {
    alert("Activa y completa al menos un componente del aula.");
    return;
  }

  renderPreview();
  alert("Componentes del aula guardados correctamente.");
});

btnLimpiar.addEventListener("click", () => {
  if (confirm("¿Seguro que deseas limpiar todo el inventario?")) {
    machineRecords.length = 0;
    aulaRecords.length = 0;
    renderPreview();
  }
});

function columnLetter(num) {
  let letter = "";
  while (num > 0) {
    const rem = (num - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}

function autoWidth(worksheet) {
  worksheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : "";
      max = Math.max(max, value.length);
    });
    col.width = Math.min(max + 2, 40);
  });
}

function styleHeaderRow(worksheet, rowNumber) {
  const row = worksheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: "FFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1E3A8A" }
  };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

function styleDataSheet(worksheet, estadoColIndex, headerRowNumber) {
  worksheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

  worksheet.eachRow((row, rowNumber) => {
    row.height = 22;

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      if (rowNumber > headerRowNumber && colNumber === estadoColIndex) {
        if (cell.value === "Bueno") {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "C6F6D5" }
          };
          cell.font = { bold: true, color: { argb: "166534" } };
        }

        if (cell.value === "Malogrado") {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FECACA" }
          };
          cell.font = { bold: true, color: { argb: "991B1B" } };
        }
      }
    });
  });

  autoWidth(worksheet);
}

function writeInstitutionBlock(ws, lastColLetter, title, logoImageId) {

  // =========================
  // TITULO
  // =========================
  ws.mergeCells(`A1:${lastColLetter}1`);

  const titleCell = ws.getCell("A1");
  titleCell.value = title.toUpperCase();

  titleCell.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFF" }
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1E3A8A" }
  };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  // =========================
  // COLEGIO
  // =========================
  ws.mergeCells(`A2:${lastColLetter}2`);

  const colegioCell = ws.getCell("A2");

  colegioCell.value =
    `INSTITUCIÓN EDUCATIVA: ${leer("colegio") || "________________"}`;

  colegioCell.font = {
    bold: true,
    size: 12
  };

  colegioCell.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  // =========================
  // ENCABEZADOS
  // =========================

  ws.mergeCells("A4:C4");
  ws.mergeCells("D4:F4");
  ws.mergeCells("G4:I4");

  ws.getCell("A4").value = "RESPONSABLE";
  ws.getCell("D4").value = "FECHA";
  ws.getCell("G4").value = "AÑO";

  ["A4", "D4", "G4"].forEach((cell) => {
    ws.getCell(cell).font = {
      bold: true,
      color: { argb: "FFFFFF" }
    };

    ws.getCell(cell).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2563EB" }
    };

    ws.getCell(cell).alignment = {
      horizontal: "center",
      vertical: "middle"
    };
  });

  // =========================
  // DATOS
  // =========================

  ws.mergeCells("A5:C5");
  ws.mergeCells("D5:F5");
  ws.mergeCells("G5:I5");

  ws.getCell("A5").value =
    leer("responsable") || "________________";

  ws.getCell("D5").value =
    leer("fechaGeneracion");

  ws.getCell("G5").value =
    leer("anio");

  ["A5", "D5", "G5"].forEach((cell) => {

    ws.getCell(cell).alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    ws.getCell(cell).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // =========================
  // LOGO
  // =========================

  if (logoImageId !== null) {

    ws.addImage(logoImageId, {
      tl: { col: 0.15, row: 0.15 },
      ext: {
        width: 70,
        height: 70
      }
    });

  }

  ws.getRow(1).height = 28;
  ws.getRow(2).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 22;
}

function createDataSheet(workbook, name, columns, rows, estadoColIndex, logoImageId) {
  const ws = workbook.addWorksheet(name);
  const lastColLetter = columnLetter(columns.length);

  ws.columns = columns.map((col) => ({
    key: col.key,
    width: col.width
  }));

  writeInstitutionBlock(ws, lastColLetter, name, logoImageId);

  const totalBueno = rows.filter((r) => r.estado === "Bueno").length;
  const totalMalogrado = rows.filter((r) => r.estado === "Malogrado").length;
  const totalGeneral = rows.length;

  // TITULO RESUMEN

  ws.mergeCells("A7:I7");

  ws.getCell("A7").value = "RESUMEN DEL INVENTARIO";

  ws.getCell("A7").font = {
    bold: true,
    color: { argb: "FFFFFF" }
  };

  ws.getCell("A7").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0F766E" }
  };

  ws.getCell("A7").alignment = {
    horizontal: "center"
  };
  ws.mergeCells("A8:C8");
  ws.mergeCells("D8:F8");
  ws.mergeCells("G8:I8");

  ws.getCell("A8").value = "TOTAL REGISTROS";
  ws.getCell("D8").value = "BUENOS";
  ws.getCell("G8").value = "MALOGRADOS";

  ws.mergeCells("A9:C9");
  ws.mergeCells("D9:F9");
  ws.mergeCells("G9:I9");

  ws.getCell("A9").value = totalGeneral;
  ws.getCell("D9").value = totalBueno;
  ws.getCell("G9").value = totalMalogrado;

  ["A8", "B8", "D8", "E8", "F8", "G8"].forEach((ref) => {
    ws.getCell(ref).font = { bold: true };
    ws.getCell(ref).alignment = { horizontal: "center" };
  });

  const headerRowNumber = 12;
  const headerRow = ws.getRow(headerRowNumber);

  columns.forEach((col, index) => {
    headerRow.getCell(index + 1).value = col.header;
  });

  styleHeaderRow(ws, headerRowNumber);

  rows.forEach((rowData) => {
    const row = ws.addRow(rowData);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
  });

  styleDataSheet(ws, estadoColIndex, headerRowNumber);
  return ws;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

btnExportar.addEventListener("click", async () => {
  if (machineRecords.length === 0 && aulaRecords.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  const workbook = new ExcelJS.Workbook();

  let logoImageId = null;
  const logoFile = document.getElementById("logo").files[0];

  if (logoFile) {
    const logoBase64 = await fileToBase64(logoFile);
    const match = logoBase64.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);

    if (match) {
      const ext = match[1].includes("png") ? "png" : "jpeg";
      logoImageId = workbook.addImage({
        base64: match[2],
        extension: ext
      });
    }
  }

  const colsMaquina = [
    { header: "Aula", key: "aula", width: 15 },
    { header: "N° Máquina", key: "numeroMaquina", width: 14 },
    { header: "Componente", key: "componente", width: 18 },
    { header: "Marca", key: "marca", width: 18 },
    { header: "Modelo", key: "modelo", width: 20 },
    { header: "N° Serie", key: "serie", width: 18 },
    { header: "Código patrimonial", key: "patrimonial", width: 20 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Observaciones", key: "observaciones", width: 30 }
  ];

  const colsAula = [
    { header: "Aula", key: "aula", width: 15 },
    { header: "Componente", key: "componente", width: 18 },
    { header: "Marca", key: "marca", width: 18 },
    { header: "Modelo", key: "modelo", width: 20 },
    { header: "N° Serie", key: "serie", width: 18 },
    { header: "Código patrimonial", key: "patrimonial", width: 20 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Observaciones", key: "observaciones", width: 30 }
  ];

  createDataSheet(
    workbook,
    "CPU",
    colsMaquina,
    machineRecords.filter((x) => x.componente === "CPU"),
    8,
    logoImageId
  );

  createDataSheet(
    workbook,
    "Pantallas",
    colsMaquina,
    machineRecords.filter((x) => x.componente === "Pantalla"),
    8,
    logoImageId
  );

  createDataSheet(
    workbook,
    "Mouse",
    colsMaquina,
    machineRecords.filter((x) => x.componente === "Mouse"),
    8,
    logoImageId
  );

  createDataSheet(
    workbook,
    "Teclado",
    colsMaquina,
    machineRecords.filter((x) => x.componente === "Teclado"),
    8,
    logoImageId
  );

  createDataSheet(
    workbook,
    "Componentes Aula",
    colsAula,
    aulaRecords,
    7,
    logoImageId
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  saveAs(blob, "Inventario_Aula.xlsx");
});

renderPreview();