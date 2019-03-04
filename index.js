// Plugin that adds hierarchy numbering to headers, like "1. XXX", "1.2 YYY" etc
//
// Theory of operation:
//
// - Process tokens at the 'renderer' phase, the last phase in the markdown-it processing
//   path
// - Add rules for 'heading_open' and 'text'
// - In 'heading_open' identify the child token that contains the contents we want to add the hierarchy
//   number to and store it for the 'text' rule
// - In the 'text' rule if we find the matching token the token is modified to append the hierarchy text,
//   the token is rendered and the output stored, and the token restoreds

let generateHierarchicalText = function (accumulator, level) {
    let value = ''

    for (let header in accumulator) {
        value += `${accumulator[header]}.`

        if (header == level) {
            return `${value} `
        }
    }

    return `${value} `
}

let hierarchy = function (md, opts) {
    let accumulator = {}
    let last = ''
    let hierarchyTextOutput = ''
    let waitingForObject = null

    // Store the previous rules so we can call the previous rules. This allows
    // us to insert ourselves without disrupting other plugins that are also
    // attaching to the same rules
    var previousTextRule = md.renderer.rules.text
    var previousHeadingOpenRule = md.renderer.rules.heading_open

    md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
        let level = tokens[idx].tag

        if (last < level) {
            accumulator[level] = 1
        } else {
            accumulator[level]++
        }

        last = level

        hierarchyTextOutput = generateHierarchicalText(accumulator, level)

        // store the object that the text rule will look to modify when the rules engine
        // gets to that point
        waitingForObject = tokens[idx + 1].children[0]

        // call the previous rule if one was found or the default rule if none was found
        // this reduces the chance of conflict with other plugins
        if(previousHeadingOpenRule !== undefined) {
            returnValue = previousHeadingOpenRule(tokens, idx, options, env, self)
        } else {
            returnValue = self.renderToken(tokens, idx, options, env, self)
        }

        return returnValue
    }

    md.renderer.rules.text = function (tokens, idx, options, env, self) {
        originalContent = tokens[idx].content

        // if this is the token we should be altering, alter its content
        if(tokens[idx] === waitingForObject) {
            tokens[idx].content = hierarchyTextOutput + originalContent
        }

        // call the previous rule if one was found or the default rule if none was found
        // this reduces the chance of conflict with other plugins
        if(previousTextRule !== undefined) {
            returnValue = previousTextRule(tokens, idx, options, env, self)
        } else {
            returnValue = self.renderToken(tokens, idx, options, env, self)
        }

        // restore content to avoid potential unintended consequences with other plugins
        tokens[idx].content = originalContent

        return returnValue
      }
}

module.exports = hierarchy
