// Regression tests for research author-name cleaning
// (suffix/triple merging, surname pairing, canonical formatting, corpus).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  helpers: { normalizeAuthorName, parseAuthors, parseAuthorsBatch },
} = require("./src/controllers/research/researchUploadController");

describe("normalizeAuthorName (Surname, Firstname, M.I.)", () => {
  const cases = [
    ["Palma, Merryrose R.", "Palma, Merryrose, R."],
    ["Merryrose Palma", "Palma, Merryrose"],
    ["Dela Cruz, Jr., Juan", "Dela Cruz, Juan"],
    ["Dr. Leodegario M. Jalos, Jr.", "Jalos, Leodegario, M."],
    ["Generoso E. Udanga", "Udanga, Generoso, E."],
    ["Degras, Arriane Grace R.", "Degras, Arriane Grace, R."],
    ["Juan Dela Cruz", "Dela Cruz, Juan"],
    ["Reyes, A.", "Reyes, A."],
    ["Santos", "Santos"],
    ["Lemente Jr., Renato F.", "Lemente, Renato, F."],
    ["Alfredo M. Ofrecio II", "Ofrecio, Alfredo, M."],
    ["Acejo, Alvaro S.", "Acejo, Alvaro, S."],
    ["Michael V. Capiña", "Capiña, Michael, V."],
    ["", ""],
  ];
  for (const [input, want] of cases) {
    it(JSON.stringify(input), () => {
      assert.strictEqual(normalizeAuthorName(input), want);
    });
  }
});

describe("parseAuthors", () => {
  const cases = [
    ["Dela Cruz, Jr., Juan; Santos, Maria", ["Dela Cruz, Juan", "Santos, Maria"]],
    ["Merryrose Palma", ["Palma, Merryrose"]],
    [
      "Degras, Arriane Grace R., Ciriaco, Frederick M.",
      ["Degras, Arriane Grace, R.", "Ciriaco, Frederick, M."],
    ],
    [
      "Nepomuceno C. Par,, III, Sajul, Glaidys Ghail P",
      ["Par, Nepomuceno, C.", "Sajul, Glaidys Ghail, P."],
    ],
    [
      "Acejo, Alvaro S.Dr. Leodegario M. Jalos, Jr.",
      ["Acejo, Alvaro, S.", "Jalos, Leodegario, M."],
    ],
    [
      "Generoso E. Udanga, Abraham L. Cuevas",
      ["Udanga, Generoso, E.", "Cuevas, Abraham, L."],
    ],
    ["Nolos, Ronnel, Bugarin, Jeany", ["Nolos, Ronnel", "Bugarin, Jeany"]],
    [
      "Nolos, Ronnel, Mandia, Eangeline, B., Rabi, Christian Russel",
      ["Nolos, Ronnel", "Mandia, Eangeline, B.", "Rabi, Christian Russel"],
    ],
    [
      "Medianista, Roja, Sapungan, Neil Cezar",
      ["Medianista, Roja", "Sapungan, Neil Cezar"],
    ],
    ["Santos, A., Reyes, Juan", ["Santos, A.", "Reyes, Juan"]],
    [
      "Historillo, Adling, Nikka Mae J., Rocha, Aynah N.",
      ["Historillo, Adling", "Nikka Mae, J.", "Rocha, Aynah, N."],
    ],
    [
      "Dela Cruz, Danica Nina, M., Rodelas, Emelita, R.",
      ["Dela Cruz, Danica Nina, M.", "Rodelas, Emelita, R."],
    ],
    ["De Chavez, Palma, D.", ["De Chavez, Palma, D."]],
    ["Cruz, Ana, R., Santos, Luz", ["Cruz, Ana, R.", "Santos, Luz"]],
    ["Udanga, Cuevas", ["Udanga", "Cuevas"]],
    ["Nobleza, Randy", ["Nobleza", "Randy"]],
    ["", ["Unknown Author"]],
  ];
  for (const [input, want] of cases) {
    it(JSON.stringify(input), () => {
      assert.deepStrictEqual(parseAuthors(input), want);
    });
  }
});

describe("parseAuthorsBatch (sheet surname corpus)", () => {
  it("pairs known-surname two-fragment cells, splits the rest", () => {
    assert.deepStrictEqual(
      parseAuthorsBatch([
        "Randy T. Nobleza",
        "Nobleza, Randy",
        "Udanga, Cuevas",
        "Santos, Reyes",
      ]),
      [
        ["Nobleza, Randy, T."],
        ["Nobleza, Randy"],
        ["Udanga", "Cuevas"],
        ["Santos", "Reyes"],
      ],
    );
  });
});
