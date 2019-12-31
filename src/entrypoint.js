import { promises as fs } from 'fs'
import path from 'path'
import cheerio from 'cheerio'

const toSnakeCase = (string) => string
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/:/g, '')
  .replace(/ \- /g, '_')
  .replace(/\s|\./g, '_')

const normalizeValue = (string) => {
  string = string.trim()
  if (string === '') return null
  if (/^\d+(\.\d+)?$/.test(string)) return Number(string)
  return string
}

const entrypoint = async (input = 'blizzard_data.html', output = 'blizzard_data.json') => {

  const inPath = path.join(process.cwd(), input)
  const outPath = path.join(process.cwd(), output)
  const html = await fs.readFile(inPath, { encoding: 'utf8' })
  const $ = cheerio.load(html)

  $('body div').first().remove()
  const json = {}
  let title
  let subtitle
  $('h1,h2,table').each((index, element) => {
    switch (element.tagName) {
      case 'h1':
        title = toSnakeCase($(element).text())
        json[title] = {}
        break
      case 'h2':
        subtitle = toSnakeCase($(element).text())
        json[title][subtitle] = []
        break
      case 'table':
        const titles = []
        $('thead tr th', element).each((index, element) => {
          titles.push(toSnakeCase($(element).text()))
        })

        $('tbody tr', element).each((index, element) => {
          const item = {}
          $('td', element).each((index, element) => {
            item[titles[index]] = normalizeValue($(element).text())
          })
          json[title][subtitle].push(item)
        })

        break
      default: break
    }
  })

  await fs.writeFile(outPath, JSON.stringify(json, null, 2))
}

entrypoint(...process.argv.splice(2))
  .catch(console.error)
