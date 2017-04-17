Feature: Message consume
  In order to test adapter functionality
  As an API client
  I need to publish messages and consume them

  Background:
    Given ensure adapter is running
    And remove result file "features/tmp/result.out"

  Scenario: Endpoint
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_endpoint"
    And I wait for response for 1 sec
    And ensure php sever is running
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null
    And the result should have message properties
    And the header "custom_property" should equal "custom_value"

  Scenario: Command without compression
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_command_without_compression"
    And I wait for response for 1 sec
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null

  Scenario: Command with props without compression
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_command_with_props_without_compression"
    And I wait for response for 1 sec
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null
    And the result should have message properties
    And the header "custom_property" should equal "custom_value"

  Scenario: Command with gzcompress compression
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_command_with_gzcompress"
    And I wait for response for 1 sec
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null

  Scenario: Command with props with gzcompress compression
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_command_with_props_gzcompress"
    And I wait for response for 1 sec
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null
    And the result should have message properties
    And the header "custom_property" should equal "custom_value"

  Scenario: Command with gzdeflate compression
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_command_with_gzdeflate"
    And I wait for response for 1 sec
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null

  Scenario: Command with props with gzdeflate compression
    Given I have the payload:
    """
    {
      "string" : "I'm from a test!",
      "string2" : "ąśćżółp",
      "number" : 2,
      "float" : 2.2234,
      "null" : null
    }
    """
    When I send on queue "behat_command_with_props_gzdeflate"
    And I wait for response for 1 sec
    Then the result should be in "features/tmp/result.out"
    And the result should be a json
    And the "string" property should equal "I'm from a test!"
    And the "string2" property should equal "ąśćżółp"
    And the "number" property should equal "2"
    And the "float" property should equal "2.2234"
    And the "null" property should be null
    And the result should have message properties
    And the header "custom_property" should equal "custom_value"